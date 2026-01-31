import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import type { ScanResult, ImageLog } from "@shared/schema";

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
      
      let images: ImageLog[];
      if (existingImages.length === 0) {
        const mockImages = generateMockImages(domain);
        images = [];
        for (const img of mockImages) {
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
      } else {
        // Reset all images to pending status for fresh scan
        images = [];
        for (const img of existingImages) {
          if (img.status === "optimized") {
            const resetImg = await storage.updateImageLogStatus(img.id, "pending", null);
            images.push(resetImg);
          } else {
            images.push(img);
          }
        }
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

  return httpServer;
}
