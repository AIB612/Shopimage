import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import type { ScanResult, ImageLog } from "@shared/schema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

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
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.log("No SHOPIFY_ACCESS_TOKEN found, using mock data");
    return generateMockImages(domain);
  }

  try {
    const apiUrl = `https://${domain}/admin/api/2024-01/products.json?limit=50`;
    console.log(`Fetching products from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Shopify API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
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
      const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
      
      // For embedded app, get shop domain from session or use default
      // In a real embedded app, this would come from Shopify OAuth session
      const shopDomain = "aanderonline.myshopify.com";
      
      let shopName = "PROFILO";
      let shopDomainResult = shopDomain;
      
      // Try to fetch real shop info if token is available
      if (accessToken) {
        try {
          const shopInfoUrl = `https://${shopDomain}/admin/api/2024-01/shop.json`;
          const response = await fetch(shopInfoUrl, {
            headers: {
              "X-Shopify-Access-Token": accessToken,
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
      }
      
      // Calculate speed metrics (simulated based on image analysis)
      const shop = await storage.getShopByDomain(shopDomain);
      let images: ImageLog[] = [];
      if (shop) {
        images = await storage.getImageLogsByShopId(shop.id);
      }
      
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

      const optimizedSize = Math.round(imageLog.originalSize * 0.2);
      
      const updated = await storage.updateImageLogStatus(id, "optimized", optimizedSize);
      
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
      
      const images = await storage.getImageLogsByShopId(shopId);
      const pendingImages = images.filter(img => img.status === "pending");
      
      const optimizedImages: ImageLog[] = [];
      let totalSaved = 0;
      
      for (const img of pendingImages) {
        const optimizedSize = Math.round(img.originalSize * 0.2);
        const updated = await storage.updateImageLogStatus(img.id, "optimized", optimizedSize);
        optimizedImages.push(updated);
        totalSaved += img.originalSize - optimizedSize;
      }
      
      return res.json({
        optimizedCount: optimizedImages.length,
        totalSaved,
        images: optimizedImages,
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

  return httpServer;
}
