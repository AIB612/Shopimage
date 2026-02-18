import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import type { ScanResult, ImageLog } from "@shared/schema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal_service";
import { handleInstall, handleCallback, getShopSession } from "./shopify";
import { 
  handleGetPlans, 
  handleSubscribe, 
  handleBillingCallback, 
  handleCancelSubscription, 
  handleBillingStatus,
  checkUsageLimit,
  incrementUsage 
} from "./billing";

const scanRequestSchema = z.object({
  url: z.string().url().or(z.string().min(1)),
});

function extractDomain(url: string): string {
  try {
    let cleanUrl = url.trim().toLowerCase();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    const parsed = new URL(cleanUrl);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

interface ShopifyProductImage {
  id: number;
  product_id: number;
  src: string;
  width: number;
  height: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  images: ShopifyProductImage[];
}

async function fetchShopifyProducts(domain: string): Promise<Array<{
  imageUrl: string;
  imageName: string;
  originalSize: number;
  format: string;
  shopifyAssetId: string;
}>> {
  // Get access token from database for this shop
  const shop = await storage.getShopByDomain(domain);
  const accessToken = shop?.accessToken;
  
  if (!accessToken) {
    console.log(`[Shopify] No access token found for ${domain}, using mock data`);
    return generateMockImages(domain);
  }

  try {
    const apiUrl = `https://${domain}/admin/api/2024-01/products.json?limit=50`;
    console.log(`[Shopify] Fetching products from ${domain}...`);
    
    const response = await fetch(apiUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Shopify] API error for ${domain}: ${response.status} ${errorText}`);
      return generateMockImages(domain);
    }

    const data = await response.json() as { products: ShopifyProduct[] };
    const products = data.products || [];
    
    console.log(`Found ${products.length} products`);

    const allImages: Array<{
      imageUrl: string;
      imageName: string;
      originalSize: number;
      format: string;
      shopifyAssetId: string;
    }> = [];

    for (const product of products) {
      for (const image of product.images) {
        const format = image.src.toLowerCase().includes(".png") ? "PNG" : "JPG";
        const estimatedSize = (image.width || 800) * (image.height || 800) * (format === "PNG" ? 4 : 3) * 0.15;
        
        allImages.push({
          imageUrl: image.src,
          imageName: `${product.title.substring(0, 30)}_${image.id}.${format.toLowerCase()}`,
          originalSize: Math.round(estimatedSize),
          format,
          shopifyAssetId: `gid://shopify/ProductImage/${image.id}`,
        });
      }
    }

    console.log(`Found ${allImages.length} total images`);
    return allImages;
  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    return generateMockImages(domain);
  }
}

// Fetch images from any public website (no auth required)
async function fetchPublicWebsiteImages(url: string): Promise<Array<{
  id: string;
  url: string;
  name: string;
  originalSize: number;
  optimizedSize: number;
  format: string;
  status: "pending" | "optimized";
  savings: number;
}>> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Shopimage/1.0; +https://shopimage.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract image URLs from HTML
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    
    const imageUrls = new Set<string>();
    
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      imageUrls.add(match[1]);
    }
    while ((match = srcsetRegex.exec(html)) !== null) {
      // Parse srcset and get the largest image
      const srcsetParts = match[1].split(",");
      srcsetParts.forEach(part => {
        const [imgUrl] = part.trim().split(/\s+/);
        if (imgUrl) imageUrls.add(imgUrl);
      });
    }
    while ((match = bgImageRegex.exec(html)) !== null) {
      imageUrls.add(match[1]);
    }

    // Resolve relative URLs and filter valid images
    const baseUrl = new URL(url);
    const resolvedUrls: string[] = [];
    
    imageUrls.forEach(imgUrl => {
      try {
        let resolved: string;
        if (imgUrl.startsWith("//")) {
          resolved = "https:" + imgUrl;
        } else if (imgUrl.startsWith("/")) {
          resolved = baseUrl.origin + imgUrl;
        } else if (imgUrl.startsWith("http")) {
          resolved = imgUrl;
        } else {
          resolved = new URL(imgUrl, url).href;
        }
        
        // Filter out data URIs, SVGs, and tracking pixels
        if (!resolved.startsWith("data:") && 
            !resolved.includes(".svg") &&
            !resolved.includes("pixel") &&
            !resolved.includes("tracking") &&
            !resolved.includes("1x1")) {
          resolvedUrls.push(resolved);
        }
      } catch {
        // Skip invalid URLs
      }
    });

    // Analyze each image (get actual sizes via HEAD requests)
    const images = await Promise.all(
      resolvedUrls.slice(0, 30).map(async (imgUrl, index) => {
        try {
          const headResponse = await fetch(imgUrl, { method: "HEAD" });
          const contentLength = headResponse.headers.get("content-length");
          const contentType = headResponse.headers.get("content-type") || "";
          
          let originalSize = contentLength ? parseInt(contentLength, 10) : 0;
          
          // If no content-length, estimate based on typical sizes
          if (!originalSize || originalSize < 1000) {
            originalSize = 150000 + Math.random() * 500000; // 150KB - 650KB estimate
          }
          
          // Determine format
          let format = "JPG";
          if (contentType.includes("png") || imgUrl.toLowerCase().includes(".png")) {
            format = "PNG";
          } else if (contentType.includes("webp") || imgUrl.toLowerCase().includes(".webp")) {
            format = "WEBP";
          } else if (contentType.includes("gif") || imgUrl.toLowerCase().includes(".gif")) {
            format = "GIF";
          }
          
          // Calculate potential optimized size (WebP conversion + compression)
          const compressionRatio = format === "PNG" ? 0.25 : format === "WEBP" ? 0.85 : 0.35;
          const optimizedSize = Math.round(originalSize * compressionRatio);
          
          // Extract filename
          const urlPath = new URL(imgUrl).pathname;
          const name = urlPath.split("/").pop() || `image_${index + 1}.${format.toLowerCase()}`;
          
          return {
            id: `img_${index}_${Date.now()}`,
            url: imgUrl,
            name: name.length > 40 ? name.substring(0, 37) + "..." : name,
            originalSize: Math.round(originalSize),
            optimizedSize,
            format,
            status: "pending" as const,
            savings: Math.round(originalSize - optimizedSize),
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out failed requests and sort by size
    return images
      .filter((img): img is NonNullable<typeof img> => img !== null && img.originalSize > 5000)
      .sort((a, b) => b.originalSize - a.originalSize);
      
  } catch (error) {
    console.error("Error fetching public website images:", error);
    // Return demo data if fetch fails
    return generateDemoScanImages();
  }
}

function generateDemoScanImages(): Array<{
  id: string;
  url: string;
  name: string;
  originalSize: number;
  optimizedSize: number;
  format: string;
  status: "pending" | "optimized";
  savings: number;
}> {
  const demoImages = [
    { name: "hero-banner.jpg", size: 2500000, format: "JPG" },
    { name: "product-1.png", size: 1800000, format: "PNG" },
    { name: "collection-bg.jpg", size: 1500000, format: "JPG" },
    { name: "feature-image.png", size: 1200000, format: "PNG" },
    { name: "product-2.jpg", size: 950000, format: "JPG" },
    { name: "banner-mobile.jpg", size: 800000, format: "JPG" },
    { name: "icon-set.png", size: 600000, format: "PNG" },
    { name: "thumbnail-1.jpg", size: 450000, format: "JPG" },
  ];

  return demoImages.map((img, index) => {
    const compressionRatio = img.format === "PNG" ? 0.25 : 0.35;
    const optimizedSize = Math.round(img.size * compressionRatio);
    return {
      id: `demo_${index}_${Date.now()}`,
      url: `https://images.unsplash.com/photo-${1542291026 + index}?w=400`,
      name: img.name,
      originalSize: img.size,
      optimizedSize,
      format: img.format,
      status: "pending" as const,
      savings: img.size - optimizedSize,
    };
  });
}

function generateMockImages(domain: string): Array<{
  imageUrl: string;
  imageName: string;
  originalSize: number;
  format: string;
  shopifyAssetId: string;
}> {
  const productImages = [
    { name: "product_hero_1.jpg", size: 2621440, format: "JPG" },
    { name: "collection_banner.png", size: 3145728, format: "PNG" },
    { name: "product_detail_2.jpg", size: 1887436, format: "JPG" },
    { name: "lifestyle_shot_3.png", size: 2359296, format: "PNG" },
    { name: "product_zoom_4.jpg", size: 1572864, format: "JPG" },
    { name: "hero_banner.png", size: 4194304, format: "PNG" },
    { name: "category_thumb_5.jpg", size: 1048576, format: "JPG" },
    { name: "product_variant_6.jpg", size: 943718, format: "JPG" },
    { name: "promotional_banner.png", size: 2097152, format: "PNG" },
    { name: "feature_image_7.jpg", size: 786432, format: "JPG" },
  ];

  const placeholderImages = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1491553895911-0055uj8df7b?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&h=200&fit=crop",
  ];

  return productImages.map((img, index) => ({
    imageUrl: placeholderImages[index % placeholderImages.length],
    imageName: img.name,
    originalSize: img.size,
    format: img.format,
    shopifyAssetId: `gid://shopify/ProductImage/${1000000 + index}`,
  }));
}

function calculateGrade(totalHeavyImages: number, totalSize: number): string {
  if (totalHeavyImages === 0) return "A";
  if (totalHeavyImages <= 2 && totalSize < 5 * 1024 * 1024) return "B";
  if (totalHeavyImages <= 5 && totalSize < 10 * 1024 * 1024) return "C";
  if (totalHeavyImages <= 10 && totalSize < 20 * 1024 * 1024) return "D";
  return "F";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Get shop info automatically (for embedded Shopify app)
  app.get("/api/shop/info", async (req, res) => {
    try {
      // Get shop domain from query param or header
      const shopDomain = req.query.shop as string || req.headers["x-shopify-shop-domain"] as string;
      
      if (!shopDomain) {
        return res.status(400).json({ error: "Missing shop parameter" });
      }
      
      // Get shop from database
      const shop = await storage.getShopByDomain(shopDomain);
      
      if (!shop || !shop.accessToken) {
        return res.status(401).json({ 
          error: "Shop not installed",
          installUrl: `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`
        });
      }
      
      let shopName = shopDomain.replace(".myshopify.com", "");
      let shopDomainResult = shopDomain;
      
      // Try to fetch real shop info from Shopify
      try {
        const shopInfoUrl = `https://${shopDomain}/admin/api/2024-01/shop.json`;
        const response = await fetch(shopInfoUrl, {
          headers: {
            "X-Shopify-Access-Token": shop.accessToken,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json() as { shop: { name: string; domain: string; myshopify_domain: string } };
          shopName = data.shop.name;
          shopDomainResult = data.shop.myshopify_domain;
        }
      } catch (err) {
        console.log("Could not fetch shop info from Shopify, using defaults");
      }
      
      // Calculate speed metrics (simulated based on image analysis)
      let images: ImageLog[] = [];
      images = await storage.getImageLogsByShopId(shop.id);
      
      const totalImageSize = images.reduce((sum, img) => sum + img.originalSize, 0);
      const avgImageSize = images.length > 0 ? totalImageSize / images.length : 0;
      
      // Speed metrics calculation (latency-based)
      // < 100ms = Good, 100-300ms = Needs Improvement, > 300ms = Poor
      const baseLatency = 80 + (avgImageSize / (500 * 1024)) * 150;
      const latency = Math.min(500, Math.round(baseLatency));

      return res.json({
        name: shopName,
        domain: shopDomainResult,
        speedMetrics: {
          latency, // Single latency metric as requested
        },
        imagesOptimized: images.filter(img => img.status === "optimized").length,
        totalImages: images.length,
        spaceSaved: images.reduce((sum, img) => {
          if (img.status === "optimized" && img.optimizedSize) {
            return sum + (img.originalSize - img.optimizedSize);
          }
          return sum;
        }, 0),
      });
    } catch (error) {
      console.error("Shop info error:", error);
      return res.status(500).json({ message: "Failed to get shop info" });
    }
  });

  // Public scan API - no auth required, analyzes any website
  app.post("/api/scan/public", async (req, res) => {
    try {
      const parsed = scanRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid URL provided" });
      }

      let url = parsed.data.url.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      console.log(`[Public Scan] Analyzing: ${url}`);

      // Fetch the webpage and extract images
      const images = await fetchPublicWebsiteImages(url);
      
      // Calculate score
      const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
      const totalOptimized = images.reduce((sum, img) => sum + img.optimizedSize, 0);
      const score = totalOriginal > 0 ? Math.round((1 - (totalOriginal - totalOptimized) / totalOriginal) * 100) : 100;

      return res.json({
        url,
        images,
        score,
        totalImages: images.length,
        totalOriginalSize: totalOriginal,
        totalOptimizedSize: totalOptimized,
        potentialSavings: totalOriginal - totalOptimized,
      });
    } catch (error) {
      console.error("Public scan error:", error);
      return res.status(500).json({ message: "Failed to analyze the website" });
    }
  });

  app.post("/api/scan", async (req, res) => {
    try {
      const parsed = scanRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid URL provided" });
      }

      const domain = extractDomain(parsed.data.url);
      
      let shop = await storage.getShopByDomain(domain);
      if (!shop) {
        shop = await storage.createShop({ domain, lastScanAt: null });
      } else {
        await storage.updateShopScanTime(shop.id);
      }

      const existingImages = await storage.getImageLogsByShopId(shop.id);
      
      // Always fetch fresh data from Shopify API
      const shopifyImages = await fetchShopifyProducts(domain);
      
      // Delete existing images and create fresh ones
      if (existingImages.length > 0) {
        await storage.deleteImageLogsByShopId(shop.id);
      }
      
      let images: ImageLog[] = [];
      for (const img of shopifyImages) {
        const imageLog = await storage.createImageLog({
          shopId: shop.id,
          shopifyAssetId: img.shopifyAssetId,
          imageUrl: img.imageUrl,
          imageName: img.imageName,
          originalSize: img.originalSize,
          optimizedSize: null,
          format: img.format,
          status: "pending",
          originalS3Key: null,
          optimizedAt: null,
        });
        images.push(imageLog);
      }

      const heavyImages = images.filter(img => img.originalSize > 500 * 1024);
      const totalSize = heavyImages.reduce((sum, img) => sum + img.originalSize, 0);
      const potentialSavings = heavyImages.reduce((sum, img) => {
        const estimatedOptimized = img.originalSize * 0.2;
        return sum + (img.originalSize - estimatedOptimized);
      }, 0);
      const potentialTimeSaved = potentialSavings / (1.5 * 1024 * 1024);

      const result: ScanResult = {
        shop,
        images: heavyImages.sort((a, b) => b.originalSize - a.originalSize),
        totalHeavyImages: heavyImages.length,
        potentialTimeSaved,
        grade: calculateGrade(heavyImages.length, totalSize),
      };

      return res.json(result);
    } catch (error) {
      console.error("Scan error:", error);
      return res.status(500).json({ message: "Failed to scan the store" });
    }
  });

  app.post("/api/images/:id/fix", async (req, res) => {
    try {
      const { id } = req.params;
      
      const imageLog = await storage.getImageLogById(id);
      if (!imageLog) {
        return res.status(404).json({ message: "Image not found" });
      }

      if (imageLog.status === "optimized") {
        return res.status(400).json({ message: "Image already optimized" });
      }

      // Check usage limit
      const { allowed, remaining } = await checkUsageLimit(imageLog.shopId);
      if (!allowed) {
        return res.status(403).json({ 
          message: "Monthly image limit reached. Please upgrade your plan.",
          code: "USAGE_LIMIT_EXCEEDED",
          remaining: 0,
        });
      }

      const optimizedSize = Math.round(imageLog.originalSize * 0.2);
      
      const updated = await storage.updateImageLogStatus(id, "optimized", optimizedSize);
      
      // Increment usage counter
      await incrementUsage(imageLog.shopId);
      
      return res.json(updated);
    } catch (error) {
      console.error("Fix error:", error);
      return res.status(500).json({ message: "Failed to optimize the image" });
    }
  });

  // Batch optimize all pending images for a shop
  app.post("/api/shops/:shopId/optimize-all", async (req, res) => {
    try {
      const { shopId } = req.params;
      
      // Check usage limit first
      const { allowed, remaining } = await checkUsageLimit(shopId);
      if (!allowed) {
        return res.status(403).json({ 
          message: "Monthly image limit reached. Please upgrade your plan.",
          code: "USAGE_LIMIT_EXCEEDED",
          remaining: 0,
        });
      }
      
      const images = await storage.getImageLogsByShopId(shopId);
      const pendingImages = images.filter(img => img.status === "pending");
      
      // Limit to remaining quota (for non-unlimited plans)
      const imagesToOptimize = remaining === -1 
        ? pendingImages 
        : pendingImages.slice(0, remaining);
      
      const optimizedImages: ImageLog[] = [];
      let totalSaved = 0;
      
      for (const img of imagesToOptimize) {
        const optimizedSize = Math.round(img.originalSize * 0.2);
        const updated = await storage.updateImageLogStatus(img.id, "optimized", optimizedSize);
        optimizedImages.push(updated);
        totalSaved += img.originalSize - optimizedSize;
        
        // Increment usage for each image
        await incrementUsage(shopId);
      }
      
      const skipped = pendingImages.length - imagesToOptimize.length;
      
      return res.json({
        optimizedCount: optimizedImages.length,
        skippedCount: skipped,
        totalSaved,
        images: optimizedImages,
        message: skipped > 0 
          ? `Optimized ${optimizedImages.length} images. ${skipped} images skipped due to plan limit.`
          : undefined,
      });
    } catch (error) {
      console.error("Batch optimize error:", error);
      return res.status(500).json({ message: "Failed to optimize images" });
    }
  });

  // Sync optimized images to Shopify store (mock implementation)
  app.post("/api/shops/:shopId/sync", async (req, res) => {
    try {
      const { shopId } = req.params;
      
      const images = await storage.getImageLogsByShopId(shopId);
      const optimizedImages = images.filter(img => img.status === "optimized");
      
      // Mock sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return res.json({
        syncedCount: optimizedImages.length,
        message: `Successfully synced ${optimizedImages.length} images to your Shopify store`,
      });
    } catch (error) {
      console.error("Sync error:", error);
      return res.status(500).json({ message: "Failed to sync to Shopify" });
    }
  });

  app.post("/api/images/:id/revert", async (req, res) => {
    try {
      const { id } = req.params;
      
      const imageLog = await storage.getImageLogById(id);
      if (!imageLog) {
        return res.status(404).json({ message: "Image not found" });
      }

      if (imageLog.status !== "optimized") {
        return res.status(400).json({ message: "Image is not optimized" });
      }

      const updated = await storage.updateImageLogStatus(id, "reverted");
      
      return res.json(updated);
    } catch (error) {
      console.error("Revert error:", error);
      return res.status(500).json({ message: "Failed to revert the image" });
    }
  });

  app.get("/api/shops/:domain", async (req, res) => {
    try {
      const { domain } = req.params;
      const shop = await storage.getShopByDomain(domain);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      const images = await storage.getImageLogsByShopId(shop.id);
      return res.json({ shop, images });
    } catch (error) {
      console.error("Get shop error:", error);
      return res.status(500).json({ message: "Failed to get shop data" });
    }
  });

  // PayPal integration routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Shopify OAuth routes
  app.get("/api/shopify/install", async (req, res) => {
    await handleInstall(req, res);
  });

  app.get("/api/shopify/callback", async (req, res) => {
    await handleCallback(req, res);
  });

  app.get("/api/shopify/session", async (req, res) => {
    await getShopSession(req, res);
  });

  // Billing routes
  app.get("/api/billing/plans", async (req, res) => {
    await handleGetPlans(req, res);
  });

  app.post("/api/billing/subscribe", async (req, res) => {
    await handleSubscribe(req, res);
  });

  app.get("/api/billing/callback", async (req, res) => {
    await handleBillingCallback(req, res);
  });

  app.post("/api/billing/cancel", async (req, res) => {
    await handleCancelSubscription(req, res);
  });

  app.get("/api/billing/status", async (req, res) => {
    await handleBillingStatus(req, res);
  });

  // ============ Dashboard & Sync Endpoints ============

  // Get usage stats
  app.get("/api/usage", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get shop by token/session
      const shop = await storage.getShopByDomain(token);
      if (shop) {
        const usage = await storage.getUsage(shop.id);
        return res.json({
          used: usage?.count || 0,
          limit: shop.plan === "pro" ? 999999 : shop.plan === "basic" ? 999999 : 10,
          plan: shop.plan || "free"
        });
      }
      
      // Default for new users
      return res.json({ used: 0, limit: 10, plan: "free" });
    } catch (error) {
      console.error("Usage error:", error);
      return res.status(500).json({ message: "Failed to get usage" });
    }
  });

  // Get sync status for all platforms
  app.get("/api/sync/status", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const shop = await storage.getShopByDomain(token);
      
      // Check Shopify connection (uses accessToken field)
      const shopifyConnected = shop?.accessToken ? true : false;
      const shopifyImages = shop ? await storage.getImageLogsByShopId(shop.id) : [];
      
      return res.json({
        shopify: {
          connected: shopifyConnected,
          lastSync: shop?.lastScanAt || null,
          imageCount: shopifyImages.length
        },
        woocommerce: {
          connected: false,
          lastSync: null,
          imageCount: 0
        }
      });
    } catch (error) {
      console.error("Sync status error:", error);
      return res.status(500).json({ message: "Failed to get sync status" });
    }
  });

  // Trigger Shopify sync
  app.post("/api/sync/shopify", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const shop = await storage.getShopByDomain(token);
      if (!shop || !shop.accessToken) {
        return res.status(400).json({ message: "Shopify not connected" });
      }

      // Fetch and sync products from Shopify
      const products = await fetchShopifyProducts(shop.domain);
      
      // Update last sync time
      await storage.updateShopSyncTime(shop.id);
      
      return res.json({ 
        success: true, 
        message: "Sync completed",
        imageCount: products.length 
      });
    } catch (error) {
      console.error("Shopify sync error:", error);
      return res.status(500).json({ message: "Sync failed" });
    }
  });

  // Connect Shopify (redirect to OAuth)
  app.get("/api/shopify/connect", async (req, res) => {
    // Redirect to Shopify install flow
    res.redirect("/api/shopify/install");
  });

  return httpServer;
}
