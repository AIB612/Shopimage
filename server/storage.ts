import type { Shop, InsertShop, ImageLog, InsertImageLog } from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getShopByDomain(domain: string): Promise<Shop | undefined>;
  getShopById(id: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShopScanTime(id: string): Promise<void>;
  updateShopToken(id: string, accessToken: string, scope: string): Promise<void>;
  updateShopProStatus(id: string, isPro: boolean): Promise<void>;
  getImageLogsByShopId(shopId: string): Promise<ImageLog[]>;
  createImageLog(imageLog: InsertImageLog): Promise<ImageLog>;
  updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null): Promise<ImageLog>;
  updateImageLogSyncStatus(id: string, syncStatus: "synced" | "pending"): Promise<ImageLog>;
  getImageLogById(id: string): Promise<ImageLog | undefined>;
  deleteImageLogsByShopId(shopId: string): Promise<void>;
  deleteShop(id: string): Promise<void>;
}

class MemoryStorage implements IStorage {
  private shops: Map<string, Shop> = new Map();
  private imageLogs: Map<string, ImageLog> = new Map();
  private shopIdCounter = 1;
  private imageIdCounter = 1;

  async getShopByDomain(domain: string): Promise<Shop | undefined> {
    for (const shop of this.shops.values()) {
      if (shop.domain === domain) return shop;
    }
    return undefined;
  }

  async getShopById(id: string): Promise<Shop | undefined> {
    return this.shops.get(id);
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const id = `shop_${this.shopIdCounter++}`;
    const newShop: Shop = {
      id,
      domain: shop.domain,
      accessToken: shop.accessToken || null,
      scope: shop.scope || null,
      isPro: 0,
      lastScanAt: shop.lastScanAt || null,
      createdAt: new Date(),
    };
    this.shops.set(id, newShop);
    console.log("[MemoryStorage] Created shop:", newShop.domain, "with token:", newShop.accessToken ? "***" : "null");
    return newShop;
  }

  async updateShopScanTime(id: string): Promise<void> {
    const shop = this.shops.get(id);
    if (shop) shop.lastScanAt = new Date();
  }

  async updateShopToken(id: string, accessToken: string, scope: string): Promise<void> {
    const shop = this.shops.get(id);
    if (shop) {
      shop.accessToken = accessToken;
      shop.scope = scope;
    }
  }

  async updateShopProStatus(id: string, isPro: boolean): Promise<void> {
    const shop = this.shops.get(id);
    if (shop) shop.isPro = isPro ? 1 : 0;
  }

  async getImageLogsByShopId(shopId: string): Promise<ImageLog[]> {
    const logs: ImageLog[] = [];
    for (const log of this.imageLogs.values()) {
      if (log.shopId === shopId) logs.push(log);
    }
    return logs;
  }

  async createImageLog(imageLog: InsertImageLog): Promise<ImageLog> {
    const id = `img_${this.imageIdCounter++}`;
    const newLog: ImageLog = {
      id,
      shopId: imageLog.shopId,
      shopifyAssetId: imageLog.shopifyAssetId,
      shopifyProductId: (imageLog as any).shopifyProductId || null,
      imageUrl: imageLog.imageUrl,
      imageName: imageLog.imageName,
      originalSize: imageLog.originalSize,
      optimizedSize: imageLog.optimizedSize || null,
      optimizedUrl: null,
      format: imageLog.format,
      status: imageLog.status || "pending",
      syncStatus: "pending",
      originalS3Key: imageLog.originalS3Key || null,
      optimizedAt: imageLog.optimizedAt || null,
      syncedAt: null,
      createdAt: new Date(),
    };
    this.imageLogs.set(id, newLog);
    return newLog;
  }

  async updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null): Promise<ImageLog> {
    const log = this.imageLogs.get(id);
    if (!log) throw new Error("Image log not found");
    log.status = status;
    if (status === "optimized" && optimizedSize !== undefined) {
      log.optimizedSize = optimizedSize ?? null;
      log.optimizedAt = new Date();
    } else if (status === "pending") {
      log.optimizedSize = null;
      log.optimizedAt = null;
    }
    return log;
  }

  async updateImageLogSyncStatus(id: string, syncStatus: "synced" | "pending"): Promise<ImageLog> {
    const log = this.imageLogs.get(id);
    if (!log) throw new Error("Image log not found");
    (log as any).syncStatus = syncStatus;
    if (syncStatus === "synced") {
      (log as any).syncedAt = new Date();
    }
    return log;
  }

  async getImageLogById(id: string): Promise<ImageLog | undefined> {
    return this.imageLogs.get(id);
  }

  async deleteImageLogsByShopId(shopId: string): Promise<void> {
    for (const [id, log] of this.imageLogs.entries()) {
      if (log.shopId === shopId) this.imageLogs.delete(id);
    }
  }

  async deleteShop(id: string): Promise<void> {
    this.shops.delete(id);
  }
}

class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    const pool = new pg.Pool({ connectionString });
    pool.on("error", (err: Error) => console.error("[DATABASE] Pool Error:", err.message));
    this.db = drizzle(pool, { schema });
    console.log("[DATABASE] Connection pool created.");
  }

  async getShopByDomain(domain: string): Promise<Shop | undefined> {
    const result = await this.db.select().from(schema.shops).where(eq(schema.shops.domain, domain)).limit(1);
    return result[0];
  }

  async getShopById(id: string): Promise<Shop | undefined> {
    const result = await this.db.select().from(schema.shops).where(eq(schema.shops.id, id)).limit(1);
    return result[0];
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const result = await this.db.insert(schema.shops).values(shop).returning();
    return result[0];
  }

  async updateShopScanTime(id: string): Promise<void> {
    await this.db.update(schema.shops).set({ lastScanAt: new Date() }).where(eq(schema.shops.id, id));
  }

  async updateShopToken(id: string, accessToken: string, scope: string): Promise<void> {
    await this.db.update(schema.shops).set({ accessToken, scope }).where(eq(schema.shops.id, id));
  }

  async updateShopProStatus(id: string, isPro: boolean): Promise<void> {
    await this.db.update(schema.shops).set({ isPro: isPro ? 1 : 0 }).where(eq(schema.shops.id, id));
  }

  async getImageLogsByShopId(shopId: string): Promise<ImageLog[]> {
    return this.db.select().from(schema.imageLogs).where(eq(schema.imageLogs.shopId, shopId));
  }

  async createImageLog(imageLog: InsertImageLog): Promise<ImageLog> {
    const result = await this.db.insert(schema.imageLogs).values(imageLog).returning();
    return result[0];
  }

  async updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null): Promise<ImageLog> {
    const updateData: Partial<ImageLog> = { status };
    if (status === "optimized" && optimizedSize !== undefined) {
      updateData.optimizedSize = optimizedSize ?? null;
      updateData.optimizedAt = new Date();
    } else if (status === "pending") {
      updateData.optimizedSize = null;
      updateData.optimizedAt = null;
    }
    const result = await this.db.update(schema.imageLogs).set(updateData).where(eq(schema.imageLogs.id, id)).returning();
    return result[0];
  }

  async updateImageLogSyncStatus(id: string, syncStatus: "synced" | "pending"): Promise<ImageLog> {
    const updateData: any = { syncStatus };
    if (syncStatus === "synced") {
      updateData.syncedAt = new Date();
    }
    const result = await this.db.update(schema.imageLogs).set(updateData).where(eq(schema.imageLogs.id, id)).returning();
    return result[0];
  }

  async getImageLogById(id: string): Promise<ImageLog | undefined> {
    const result = await this.db.select().from(schema.imageLogs).where(eq(schema.imageLogs.id, id)).limit(1);
    return result[0];
  }

  async deleteImageLogsByShopId(shopId: string): Promise<void> {
    await this.db.delete(schema.imageLogs).where(eq(schema.imageLogs.shopId, shopId));
  }

  async deleteShop(id: string): Promise<void> {
    await this.db.delete(schema.shops).where(eq(schema.shops.id, id));
  }
}

class ResilientStorage implements IStorage {
  private memory = new MemoryStorage();
  private db?: DatabaseStorage;
  private usingFallback = false;

  constructor() {
    if (process.env.DATABASE_URL) {
      try {
        this.db = new DatabaseStorage();
      } catch (error) {
        this.usingFallback = true;
        console.error("[STORAGE] Failed to initialize PostgreSQL, falling back to memory:", error);
      }
    } else {
      this.usingFallback = true;
      console.log("[STORAGE] No DATABASE_URL, using in-memory storage (demo mode)");
    }
  }

  private async run<T>(operation: (storage: IStorage) => Promise<T>): Promise<T> {
    if (this.db && !this.usingFallback) {
      try {
        return await operation(this.db);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[STORAGE] Database operation failed, falling back to memory:", message);
        this.usingFallback = true;
      }
    }
    return operation(this.memory);
  }

  getShopByDomain(domain: string) { return this.run(s => s.getShopByDomain(domain)); }
  getShopById(id: string) { return this.run(s => s.getShopById(id)); }
  createShop(shop: InsertShop) { return this.run(s => s.createShop(shop)); }
  updateShopScanTime(id: string) { return this.run(s => s.updateShopScanTime(id)); }
  updateShopToken(id: string, accessToken: string, scope: string) { return this.run(s => s.updateShopToken(id, accessToken, scope)); }
  updateShopProStatus(id: string, isPro: boolean) { return this.run(s => s.updateShopProStatus(id, isPro)); }
  getImageLogsByShopId(shopId: string) { return this.run(s => s.getImageLogsByShopId(shopId)); }
  createImageLog(imageLog: InsertImageLog) { return this.run(s => s.createImageLog(imageLog)); }
  updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null) { return this.run(s => s.updateImageLogStatus(id, status, optimizedSize)); }
  updateImageLogSyncStatus(id: string, syncStatus: "synced" | "pending") { return this.run(s => s.updateImageLogSyncStatus(id, syncStatus)); }
  getImageLogById(id: string) { return this.run(s => s.getImageLogById(id)); }
  deleteImageLogsByShopId(shopId: string) { return this.run(s => s.deleteImageLogsByShopId(shopId)); }
  deleteShop(id: string) { return this.run(s => s.deleteShop(id)); }
}

export const storage: IStorage = new ResilientStorage();
