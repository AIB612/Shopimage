import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const imageStatusEnum = pgEnum("image_status", ["pending", "optimized", "reverted"]);

export const shops = pgTable("shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domain: text("domain").notNull().unique(),
  accessToken: text("access_token"),
  scope: text("scope"),
  isPro: integer("is_pro").default(0),
  lastScanAt: timestamp("last_scan_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imageLogs = pgTable("image_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id").references(() => shops.id).notNull(),
  shopifyAssetId: text("shopify_asset_id").notNull(),
  imageUrl: text("image_url").notNull(),
  imageName: text("image_name").notNull(),
  originalSize: integer("original_size").notNull(),
  optimizedSize: integer("optimized_size"),
  format: text("format").notNull(),
  status: imageStatusEnum("status").default("pending").notNull(),
  originalS3Key: text("original_s3_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  optimizedAt: timestamp("optimized_at"),
});

export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  createdAt: true,
});

export const insertImageLogSchema = createInsertSchema(imageLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shops.$inferSelect;
export type InsertImageLog = z.infer<typeof insertImageLogSchema>;
export type ImageLog = typeof imageLogs.$inferSelect;

export interface ScanResult {
  shop: Shop;
  images: ImageLog[];
  totalHeavyImages: number;
  potentialTimeSaved: number;
  grade: string;
}

export interface ImageAnalysis {
  id: string;
  imageUrl: string;
  imageName: string;
  originalSize: number;
  estimatedOptimizedSize: number;
  format: string;
  timeSaved: number;
  status: "pending" | "optimized" | "reverted";
}
