import type { Shop, InsertShop, ImageLog, InsertImageLog } from "@shared/schema";

export interface IStorage {
  getShopByDomain(domain: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShopScanTime(id: string): Promise<void>;
  updateShopToken(id: string, accessToken: string, scope: string): Promise<void>;
  updateShopProStatus(id: string, isPro: boolean): Promise<void>;
  getImageLogsByShopId(shopId: string): Promise<ImageLog[]>;
  createImageLog(imageLog: InsertImageLog): Promise<ImageLog>;
  updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null): Promise<ImageLog>;
  getImageLogById(id: string): Promise<ImageLog | undefined>;
  deleteImageLogsByShopId(shopId: string): Promise<void>;
}

// In-memory storage for demo mode
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

  async createShop(shop: InsertShop): Promise<Shop> {
    const id = `shop_${this.shopIdCounter++}`;
    const newShop: Shop = {
      id,
      domain: shop.domain,
      accessToken: null,
      scope: null,
      isPro: 0,
      lastScanAt: shop.lastScanAt || null,
      createdAt: new Date(),
    };
    this.shops.set(id, newShop);
    return newShop;
  }

  async updateShopScanTime(id: string): Promise<void> {
    const shop = this.shops.get(id);
    if (shop) shop.lastScanAt = new Date();
  }

  async updateShopToken(id: string, accessToken: string, scope: string): Promise<void> {
    const shop = this.shops.get(id);
    if (shop) { shop.accessToken = accessToken; shop.scope = scope; }
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
      imageUrl: imageLog.imageUrl,
      imageName: imageLog.imageName,
      originalSize: imageLog.originalSize,
      optimizedSize: imageLog.optimizedSize || null,
      format: imageLog.format,
      status: imageLog.status || "pending",
      originalS3Key: imageLog.originalS3Key || null,
      optimizedAt: imageLog.optimizedAt || null,
      createdAt: new Date(),
    };
    this.imageLogs.set(id, newLog);
    return newLog;
  }

  async updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null): Promise<ImageLog> {
    const log = this.imageLogs.get(id);
    if (!log) throw new Error("Image log not found");
    log.status = status;
    if (status === "optimized" && optimizedSize) {
      log.optimizedSize = optimizedSize;
      log.optimizedAt = new Date();
    } else if (status === "pending") {
      log.optimizedSize = null;
      log.optimizedAt = null;
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
}

// Database storage for production (when DATABASE_URL is set)
class DatabaseStorage implements IStorage {
  private db: any;
  private shops: any;
  private imageLogs: any;
  private eq: any;

  constructor() {
    // Lazy load database modules
    const { drizzle } = require("drizzle-orm/node-postgres");
    const pg = require("pg");
    const schema = require("@shared/schema");
    const { eq } = require("drizzle-orm");
    
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    pool.on('error', (err: Error) => console.error("[DATABASE] Pool Error:", err.message));
    
    this.db = drizzle(pool, { schema });
    this.shops = schema.shops;
    this.imageLogs = schema.imageLogs;
    this.eq = eq;
    console.log("[DATABASE] Connection pool created.");
  }

  async getShopByDomain(domain: string): Promise<Shop | undefined> {
    const result = await this.db.select().from(this.shops).where(this.eq(this.shops.domain, domain)).limit(1);
    return result[0];
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const result = await this.db.insert(this.shops).values(shop).returning();
    return result[0];
  }

  async updateShopScanTime(id: string): Promise<void> {
    await this.db.update(this.shops).set({ lastScanAt: new Date() }).where(this.eq(this.shops.id, id));
  }

  async updateShopToken(id: string, accessToken: string, scope: string): Promise<void> {
    await this.db.update(this.shops).set({ accessToken, scope }).where(this.eq(this.shops.id, id));
  }

  async updateShopProStatus(id: string, isPro: boolean): Promise<void> {
    await this.db.update(this.shops).set({ isPro: isPro ? 1 : 0 }).where(this.eq(this.shops.id, id));
  }

  async getImageLogsByShopId(shopId: string): Promise<ImageLog[]> {
    return this.db.select().from(this.imageLogs).where(this.eq(this.imageLogs.shopId, shopId));
  }

  async createImageLog(imageLog: InsertImageLog): Promise<ImageLog> {
    const result = await this.db.insert(this.imageLogs).values(imageLog).returning();
    return result[0];
  }

  async updateImageLogStatus(id: string, status: "pending" | "optimized" | "reverted", optimizedSize?: number | null): Promise<ImageLog> {
    const updateData: Partial<ImageLog> = { status };
    if (status === "optimized" && optimizedSize) {
      updateData.optimizedSize = optimizedSize;
      updateData.optimizedAt = new Date();
    } else if (status === "pending") {
      updateData.optimizedSize = null;
      updateData.optimizedAt = null;
    }
    const result = await this.db.update(this.imageLogs).set(updateData).where(this.eq(this.imageLogs.id, id)).returning();
    return result[0];
  }

  async getImageLogById(id: string): Promise<ImageLog | undefined> {
    const result = await this.db.select().from(this.imageLogs).where(this.eq(this.imageLogs.id, id)).limit(1);
    return result[0];
  }

  async deleteImageLogsByShopId(shopId: string): Promise<void> {
    await this.db.delete(this.imageLogs).where(this.eq(this.imageLogs.shopId, shopId));
  }
}

// Auto-select storage based on DATABASE_URL
function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log("[STORAGE] DATABASE_URL found, using PostgreSQL");
    return new DatabaseStorage();
  } else {
    console.log("[STORAGE] No DATABASE_URL, using in-memory storage (demo mode)");
    return new MemoryStorage();
  }
}

export const storage = createStorage();
