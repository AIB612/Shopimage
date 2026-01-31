import { db } from "./db";
import { shops, imageLogs, type Shop, type InsertShop, type ImageLog, type InsertImageLog } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getShopByDomain(domain: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShopScanTime(id: string): Promise<void>;
  getImageLogsByShopId(shopId: string): Promise<ImageLog[]>;
  createImageLog(imageLog: InsertImageLog): Promise<ImageLog>;
  updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null): Promise<ImageLog>;
  getImageLogById(id: string): Promise<ImageLog | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getShopByDomain(domain: string): Promise<Shop | undefined> {
    const result = await db.select().from(shops).where(eq(shops.domain, domain)).limit(1);
    return result[0];
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const result = await db.insert(shops).values(shop).returning();
    return result[0];
  }

  async updateShopScanTime(id: string): Promise<void> {
    await db.update(shops).set({ lastScanAt: new Date() }).where(eq(shops.id, id));
  }

  async getImageLogsByShopId(shopId: string): Promise<ImageLog[]> {
    return db.select().from(imageLogs).where(eq(imageLogs.shopId, shopId));
  }

  async createImageLog(imageLog: InsertImageLog): Promise<ImageLog> {
    const result = await db.insert(imageLogs).values(imageLog).returning();
    return result[0];
  }

  async updateImageLogStatus(
    id: string,
    status: "pending" | "optimized" | "reverted",
    optimizedSize?: number | null
  ): Promise<ImageLog> {
    const updateData: Partial<ImageLog> = { status };
    if (status === "optimized" && optimizedSize) {
      updateData.optimizedSize = optimizedSize;
      updateData.optimizedAt = new Date();
    } else if (status === "pending") {
      updateData.optimizedSize = null;
      updateData.optimizedAt = null;
    }
    const result = await db.update(imageLogs).set(updateData).where(eq(imageLogs.id, id)).returning();
    return result[0];
  }

  async getImageLogById(id: string): Promise<ImageLog | undefined> {
    const result = await db.select().from(imageLogs).where(eq(imageLogs.id, id)).limit(1);
    return result[0];
  }
}

export const storage = new DatabaseStorage();
