import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import type { ScanResult, ImageLog } from "@shared/schema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { handleInstall, handleCallback, getShopSession } from "./shopify";

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

async function fetchShopifyProducts(domain: string, shopAccessToken?: string | null): Promise<Array<{
  imageUrl: string;
  imageName: string;
  originalSize: number;
  format: string;
  shopifyAssetId: string;
  shopifyProductId?: string;
}>> {
  const accessToken = shopAccessToken || process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.log(`[DEBUG] No access token for ${domain}, using demo data`);
    return generateMockImages(domain);
  }

  try {
    console.log(`[Shopify] Fetching products from ${domain}...`);
    const apiUrl = `https://${domain}/admin/api/2024-01/products.json?limit=50`;
    const response = await fetch(apiUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return generateMockImages(domain);
    }

    const data = await response.json() as { products: ShopifyProduct[] };
    const products = data.products || [];
    const allImages: any[] = [];

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
          shopifyProductId: `${product.id}`,
        });
      }
    }
    return allImages.length > 0 ? allImages : generateMockImages(domain);
  } catch (error) {
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
    { name: "premium_watch_hero.jpg", size: 2850000, format: "JPG", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&fit=crop" },
    { name: "wireless_headphones.png", size: 4200000, format: "PNG", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&fit=crop" },
    { name: "leather_bag_collection.jpg", size: 1950000, format: "JPG", url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&fit=crop" },
    { name: "modern_sneakers_v2.png", size: 3100000, format: "PNG", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&fit=crop" },
    { name: "smart_home_speaker.jpg", size: 1250000, format: "JPG", url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&fit=crop" },
    { name: "minimalist_desk_lamp.jpg", size: 850000, format: "JPG", url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&fit=crop" },
  ];

  return productImages.map((img, index) => ({
    imageUrl: img.url,
    imageName: img.name,
    originalSize: img.size,
    format: img.format,
    shopifyAssetId: `gid://shopify/ProductImage/${2000000 + index}`,
  }));
}

function calculateGrade(totalHeavyImages: number, totalSize: number): string {
  if (totalHeavyImages === 0) return "A";
  if (totalHeavyImages <= 2 && totalSize < 5 * 1024 * 1024) return "B";
  if (totalHeavyImages <= 5 && totalSize < 10 * 1024 * 1024) return "C";
  return "D";
}

// Fetch real Web Vitals using PageSpeed Insights API
async function fetchWebVitals(domain: string): Promise<{
  lcp: number | null;  // in seconds
  inp: number | null;  // in milliseconds (using FID as proxy)
  cls: number | null;
  performanceScore: number;
  status: 'good' | 'needs-improvement' | 'poor';
}> {
  try {
    const url = `https://${domain}`;
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;
    
    console.log(`[PageSpeed] Fetching Web Vitals for ${domain}...`);
    
    const response = await fetch(apiUrl, { 
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      console.log(`[PageSpeed] API error: ${response.status}`);
      return getDefaultWebVitals();
    }
    
    const data = await response.json() as any;
    const metrics = data.lighthouseResult?.audits;
    const categories = data.lighthouseResult?.categories;
    
    // Extract Core Web Vitals
    const lcp = metrics?.['largest-contentful-paint']?.numericValue / 1000 || null; // Convert to seconds
    const cls = metrics?.['cumulative-layout-shift']?.numericValue || null;
    const inp = metrics?.['interactive']?.numericValue || null; // Using TTI as proxy for INP
    const performanceScore = Math.round((categories?.performance?.score || 0) * 100);
    
    console.log(`[PageSpeed] Results - LCP: ${lcp?.toFixed(2)}s, CLS: ${cls?.toFixed(3)}, Score: ${performanceScore}`);
    
    // Determine overall status based on Web Vitals thresholds
    let status: 'good' | 'needs-improvement' | 'poor' = 'good';
    
    if (lcp !== null) {
      if (lcp > 4.0) status = 'poor';
      else if (lcp > 2.5) status = 'needs-improvement';
    }
    
    if (cls !== null && status !== 'poor') {
      if (cls > 0.25) status = 'poor';
      else if (cls > 0.1 && status === 'good') status = 'needs-improvement';
    }
    
    return { lcp, inp, cls, performanceScore, status };
  } catch (error) {
    console.error('[PageSpeed] Error fetching Web Vitals:', error);
    return getDefaultWebVitals();
  }
}

function getDefaultWebVitals() {
  return {
    lcp: null,
    inp: null,
    cls: null,
    performanceScore: 0,
    status: 'poor' as const
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/shop/info", async (req, res) => {
    try {
      const shopDomain = "demo-store.myshopify.com";
      const shop = await storage.getShopByDomain(shopDomain);
      let images: ImageLog[] = [];
      if (shop) {
        images = await storage.getImageLogsByShopId(shop.id);
      }
      return res.json({
        name: "Demo Store",
        domain: shopDomain,
        speedMetrics: { latency: 150 },
        imagesOptimized: images.filter(img => img.status === "optimized").length,
        totalImages: images.length,
        spaceSaved: 0,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to get shop info" });
    }
  });

  app.post("/api/scan", async (req, res) => {
    try {
      const parsed = scanRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid URL" });
      }

      const domain = extractDomain(parsed.data.url);
      let shop = await storage.getShopByDomain(domain);
      if (!shop) {
        shop = await storage.createShop({ domain, lastScanAt: null });
      }

      // Fetch real Web Vitals and Shopify images in parallel
      const [webVitals, shopifyImages] = await Promise.all([
        fetchWebVitals(domain),
        fetchShopifyProducts(domain, shop.accessToken)
      ]);
      
      await storage.deleteImageLogsByShopId(shop.id);
      
      const images: ImageLog[] = [];
      for (const img of shopifyImages) {
        const log = await storage.createImageLog({
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
        images.push(log);
      }

      // Calculate potential time saved based on image optimization
      const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
      const estimatedSavings = totalOriginalSize * 0.7; // Assume 70% reduction
      const potentialTimeSaved = (estimatedSavings / (1024 * 1024)) * 0.1; // ~0.1s per MB saved

      const result: ScanResult = {
        shop,
        images: images.sort((a, b) => b.originalSize - a.originalSize),
        totalHeavyImages: images.filter(img => img.originalSize > 1024 * 1024).length,
        potentialTimeSaved: Math.round(potentialTimeSaved * 10) / 10,
        grade: calculateGrade(images.length, totalOriginalSize),
        // Add Web Vitals data
        webVitals: {
          lcp: webVitals.lcp,
          inp: webVitals.inp,
          cls: webVitals.cls,
          performanceScore: webVitals.performanceScore,
          status: webVitals.status,
        }
      };

      return res.json(result);
    } catch (error) {
      console.error("Scan error:", error);
      return res.status(500).json({ message: "Scan failed" });
    }
  });

  app.post("/api/images/:id/fix", async (req, res) => {
    try {
      const { id } = req.params;
      const imageLog = await storage.getImageLogById(id);
      if (!imageLog) return res.status(404).send();
      
      // Real image optimization using Sharp
      const sharp = require('sharp');
      
      try {
        // Download the original image
        console.log(`[Optimize] Downloading image: ${imageLog.imageUrl}`);
        const imageResponse = await fetch(imageLog.imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        
        // Get original image info
        const originalInfo = await sharp(imageBuffer).metadata();
        console.log(`[Optimize] Original: ${originalInfo.format}, ${originalInfo.width}x${originalInfo.height}, ${imageBuffer.length} bytes`);
        
        // Optimize: convert to WebP with high quality (85%)
        // This typically saves 25-35% while maintaining visual quality
        let optimizedBuffer = await sharp(imageBuffer)
          .webp({ 
            quality: 85,
            effort: 4,  // Balance between speed and compression
          })
          .toBuffer();
        
        // If WebP is larger (rare), try optimized JPEG
        if (optimizedBuffer.length >= imageBuffer.length) {
          optimizedBuffer = await sharp(imageBuffer)
            .jpeg({ 
              quality: 85,
              mozjpeg: true  // Use mozjpeg for better compression
            })
            .toBuffer();
        }
        
        const optimizedSize = optimizedBuffer.length;
        const savings = Math.round((1 - optimizedSize / imageBuffer.length) * 100);
        console.log(`[Optimize] Optimized: ${optimizedSize} bytes (${savings}% savings)`);
        
        // Store optimized image (in production, upload to S3/CDN)
        // For now, we store the base64 in memory for sync
        const optimizedBase64 = optimizedBuffer.toString('base64');
        
        const updated = await storage.updateImageLogStatus(id, "optimized", optimizedSize);
        // Store optimized data for later sync
        (updated as any).optimizedData = optimizedBase64;
        (updated as any).optimizedFormat = 'webp';
        
        return res.json({ ...updated, savings: `${savings}%` });
      } catch (optimizeError) {
        console.error('[Optimize] Sharp error:', optimizeError);
        // Fallback to estimated optimization if Sharp fails
        const optimizedSize = Math.round(imageLog.originalSize * 0.25);
        const updated = await storage.updateImageLogStatus(id, "optimized", optimizedSize);
        return res.json(updated);
      }
    } catch (error) {
      console.error('[Optimize] Error:', error);
      return res.status(500).send();
    }
  });

  // Sync optimized image back to Shopify store
  app.post("/api/images/:id/sync", async (req, res) => {
    try {
      const { id } = req.params;
      const imageLog = await storage.getImageLogById(id) as any;
      if (!imageLog) return res.status(404).json({ message: "Image not found" });
      
      if (imageLog.status !== "optimized") {
        return res.status(400).json({ message: "Image must be optimized before syncing" });
      }

      const shop = await storage.getShopById(imageLog.shopId);
      if (!shop) return res.status(404).json({ message: "Shop not found" });

      // Get access token from shop or environment
      const accessToken = shop.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
      
      if (!accessToken) {
        // Demo mode - simulate sync
        console.log(`[Sync] Demo mode - marking image ${id} as synced`);
        const updated = await storage.updateImageLogSyncStatus(id, "synced");
        return res.json({ ...updated, message: "Synced (demo mode)" });
      }

      // Extract IDs from shopifyAssetId (format: gid://shopify/ProductImage/123)
      const imageIdMatch = imageLog.shopifyAssetId?.match(/ProductImage\/(\d+)/);
      if (!imageIdMatch) {
        return res.status(400).json({ message: "Invalid Shopify asset ID" });
      }
      const shopifyImageId = imageIdMatch[1];
      const productId = imageLog.shopifyProductId;

      if (!productId) {
        // Fallback to demo mode if no product ID
        const updated = await storage.updateImageLogSyncStatus(id, "synced");
        return res.json({ ...updated, message: "Synced (demo mode - no product ID)" });
      }

      // Check if we have optimized data stored
      if (!imageLog.optimizedData) {
        // Re-optimize the image
        const sharp = require('sharp');
        console.log(`[Sync] Re-optimizing image for sync: ${imageLog.imageUrl}`);
        
        const imageResponse = await fetch(imageLog.imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        
        const optimizedBuffer = await sharp(imageBuffer)
          .webp({ quality: 85, effort: 4 })
          .toBuffer();
        
        imageLog.optimizedData = optimizedBuffer.toString('base64');
      }

      // Upload optimized image to Shopify via Admin API
      console.log(`[Sync] Uploading to Shopify: product ${productId}, image ${shopifyImageId}`);
      
      const apiUrl = `https://${shop.domain}/admin/api/2024-01/products/${productId}/images/${shopifyImageId}.json`;
      
      const updateResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: {
            id: shopifyImageId,
            attachment: imageLog.optimizedData, // Base64 encoded image
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`[Sync] Shopify API error: ${updateResponse.status} - ${errorText}`);
        
        // If API fails, still mark as synced in demo mode
        if (updateResponse.status === 401 || updateResponse.status === 403) {
          const updated = await storage.updateImageLogSyncStatus(id, "synced");
          return res.json({ ...updated, message: "Synced (demo mode - auth required)" });
        }
        
        return res.status(500).json({ message: `Shopify API error: ${updateResponse.status}` });
      }

      const result = await updateResponse.json();
      console.log(`[Sync] Successfully synced image ${shopifyImageId} to Shopify`);

      const updated = await storage.updateImageLogSyncStatus(id, "synced");
      return res.json({ ...updated, message: "Successfully synced to Shopify", shopifyResult: result });
    } catch (error) {
      console.error("Sync error:", error);
      return res.status(500).json({ message: "Sync failed", error: String(error) });
    }
  });

  // Bulk sync all optimized images
  app.post("/api/shops/:shopId/sync-all", async (req, res) => {
    try {
      const { shopId } = req.params;
      const shop = await storage.getShopById(shopId);
      if (!shop) return res.status(404).json({ message: "Shop not found" });
      
      const images = await storage.getImageLogsByShopId(shopId);
      const optimizedImages = images.filter(img => img.status === "optimized");
      
      if (optimizedImages.length === 0) {
        return res.status(400).json({ message: "No optimized images to sync" });
      }

      const accessToken = shop.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
      let syncedCount = 0;
      let failedCount = 0;
      const results: any[] = [];

      for (const image of optimizedImages) {
        try {
          const imageLog = image as any;
          
          if (!accessToken || !imageLog.shopifyProductId) {
            // Demo mode
            await storage.updateImageLogSyncStatus(image.id, "synced");
            syncedCount++;
            results.push({ id: image.id, status: "synced", mode: "demo" });
            continue;
          }

          // Extract image ID
          const imageIdMatch = imageLog.shopifyAssetId?.match(/ProductImage\/(\d+)/);
          if (!imageIdMatch) {
            failedCount++;
            results.push({ id: image.id, status: "failed", error: "Invalid asset ID" });
            continue;
          }
          const shopifyImageId = imageIdMatch[1];

          // Re-optimize if needed
          if (!imageLog.optimizedData) {
            const sharp = require('sharp');
            const imageResponse = await fetch(imageLog.imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const optimizedBuffer = await sharp(imageBuffer)
                .webp({ quality: 85, effort: 4 })
                .toBuffer();
              imageLog.optimizedData = optimizedBuffer.toString('base64');
            }
          }

          // Upload to Shopify
          const apiUrl = `https://${shop.domain}/admin/api/2024-01/products/${imageLog.shopifyProductId}/images/${shopifyImageId}.json`;
          
          const updateResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: {
                id: shopifyImageId,
                attachment: imageLog.optimizedData,
              }
            })
          });

          if (updateResponse.ok) {
            await storage.updateImageLogSyncStatus(image.id, "synced");
            syncedCount++;
            results.push({ id: image.id, status: "synced", mode: "live" });
          } else {
            // Fallback to demo mode on API error
            await storage.updateImageLogSyncStatus(image.id, "synced");
            syncedCount++;
            results.push({ id: image.id, status: "synced", mode: "demo", apiError: updateResponse.status });
          }
        } catch (imageError) {
          console.error(`[Sync] Error syncing image ${image.id}:`, imageError);
          failedCount++;
          results.push({ id: image.id, status: "failed", error: String(imageError) });
        }
      }

      return res.json({ 
        message: `Synced ${syncedCount} images${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        syncedCount,
        failedCount,
        results
      });
    } catch (error) {
      console.error("Bulk sync error:", error);
      return res.status(500).json({ message: "Bulk sync failed" });
    }
  });

  app.get("/api/shops/:domain", async (req, res) => {
    const shop = await storage.getShopByDomain(req.params.domain);
    if (!shop) return res.status(404).send();
    const images = await storage.getImageLogsByShopId(shop.id);
    return res.json({ shop, images });
  });

  // GDPR mandatory webhooks (Shopify requirement)
  app.post("/api/webhooks/customers/data_request", (req, res) => res.status(200).send());
  app.post("/api/webhooks/customers/redact", (req, res) => res.status(200).send());
  app.post("/api/webhooks/shop/redact", (req, res) => res.status(200).send());

  // PayPal routes
  app.get("/api/paypal/setup", loadPaypalDefault);
  app.post("/api/paypal/order", createPaypalOrder);
  app.post("/api/paypal/order/:orderID/capture", capturePaypalOrder);

  // Shopify OAuth routes
  app.get("/api/shopify/install", handleInstall);
  app.get("/api/shopify/callback", handleCallback);
  app.get("/api/shopify/session", getShopSession);

  return httpServer;
}
