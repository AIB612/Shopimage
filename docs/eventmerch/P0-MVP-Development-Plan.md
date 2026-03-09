# 🎯 P0 MVP Features - Development Plan

## 📋 P0 Features (Must-Have)

### 1. ✅ AI-Deko-Design-Generator (AI装饰设计生成器)
### 2. ✅ POD-Produkt-Bestellung (POD产品订购)
### 3. ✅ QR-Code-Foto-Upload (QR码照片上传)
### 4. ✅ Auto-Foto-Sortierung (自动照片整理)

---

## 🏗️ Entwicklungsplan (Development Plan)

### **Sprint 1: Grundlagen** (Week 1) - Foundations
- [ ] Projektstruktur erstellen
- [ ] Database Schema definieren
- [ ] API-Routen Setup
- [ ] UI-Komponenten-Bibliothek

### **Sprint 2: AI-Design-Generator** (Week 2)
- [ ] Event-Details-Formular
- [ ] OpenAI Integration
- [ ] Design-Vorschau
- [ ] Design-Export

### **Sprint 3: POD-Integration** (Week 3)
- [ ] Printful API Integration
- [ ] Produkt-Katalog
- [ ] Warenkorb
- [ ] Checkout (Stripe)

### **Sprint 4: Foto-Upload** (Week 4)
- [ ] QR-Code-Generator
- [ ] Foto-Upload-Interface
- [ ] Cloudinary Integration
- [ ] Auto-Sortierung (去重)

### **Sprint 5: Testing & Polish** (Week 5)
- [ ] End-to-End Tests
- [ ] UI/UX Polish
- [ ] Performance Optimization
- [ ] Beta Launch Vorbereitung

---

## 📁 Projektstruktur (Project Structure)

```
EventMerch/
├── client/                          # Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Radix UI Components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── features/
│   │   │   │   ├── design-generator/
│   │   │   │   │   ├── EventDetailsForm.tsx
│   │   │   │   │   ├── DesignPreview.tsx
│   │   │   │   │   └── DesignGallery.tsx
│   │   │   │   ├── pod-shop/
│   │   │   │   │   ├── ProductCatalog.tsx
│   │   │   │   │   ├── ProductCard.tsx
│   │   │   │   │   ├── Cart.tsx
│   │   │   │   │   └── Checkout.tsx
│   │   │   │   └── photo-upload/
│   │   │   │       ├── QRCodeDisplay.tsx
│   │   │   │       ├── PhotoUploader.tsx
│   │   │   │       ├── PhotoGallery.tsx
│   │   │   │       └── PhotoSorter.tsx
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DesignGenerator.tsx
│   │   │   ├── Shop.tsx
│   │   │   ├── PhotoUpload.tsx
│   │   │   └── EventPage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts              # API Client
│   │   │   ├── utils.ts            # Utilities
│   │   │   └── constants.ts        # Constants
│   │   ├── hooks/
│   │   │   ├── useDesignGenerator.ts
│   │   │   ├── usePhotoUpload.ts
│   │   │   └── useCart.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   ├── images/
│   │   └── fonts/
│   ├── index.html
│   └── vite.config.ts
├── server/                          # Backend
│   ├── routes/
│   │   ├── events.ts               # Event CRUD
│   │   ├── designs.ts              # AI Design Generation
│   │   ├── products.ts             # POD Products
│   │   ├── photos.ts               # Photo Upload/Management
│   │   ├── orders.ts               # Order Management
│   │   └── webhooks.ts             # Stripe Webhooks
│   ├── services/
│   │   ├── openai.service.ts       # OpenAI Integration
│   │   ├── cloudinary.service.ts   # Cloudinary Integration
│   │   ├── printful.service.ts     # Printful Integration
│   │   ├── stripe.service.ts       # Stripe Integration
│   │   └── photo.service.ts        # Photo Processing
│   ├── db/
│   │   ├── schema.ts               # Drizzle Schema
│   │   ├── migrations/
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── error.ts
│   │   └── validation.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── helpers.ts
│   └── index.ts
├── shared/                          # Shared Types
│   └── types.ts
├── scripts/
│   ├── build.ts
│   └── seed.ts
├── docs/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🗄️ Database Schema (Drizzle ORM)

```typescript
// server/db/schema.ts

import { pgTable, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Events Table
export const events = pgTable('events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(),
  
  // Event Details
  type: text('type').notNull(), // 'wedding', 'birthday', 'baby-shower'
  name1: text('name1').notNull(),
  name2: text('name2'),
  date: timestamp('date').notNull(),
  location: text('location').notNull(),
  guestCount: integer('guest_count').notNull(),
  
  // Style
  style: text('style').notNull(), // 'modern-alpine', 'boho-mountain', etc.
  colors: jsonb('colors').notNull(), // ['#sage-green', '#cream', '#gold']
  
  // Status
  status: text('status').notNull().default('draft'), // 'draft', 'active', 'completed'
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Designs Table
export const designs = pgTable('designs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  eventId: text('event_id').references(() => events.id).notNull(),
  
  // Design Details
  type: text('type').notNull(), // 'welcome-sign', 'table-card', 'menu', etc.
  prompt: text('prompt').notNull(),
  imageUrl: text('image_url').notNull(),
  
  // AI Metadata
  aiModel: text('ai_model').notNull(), // 'dall-e-3', 'midjourney', etc.
  aiParams: jsonb('ai_params'),
  
  // Status
  status: text('status').notNull().default('generated'), // 'generated', 'selected', 'ordered'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Products Table (POD)
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  designId: text('design_id').references(() => designs.id).notNull(),
  
  // Product Details
  printfulProductId: text('printful_product_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // in cents
  
  // Variants
  variants: jsonb('variants').notNull(), // sizes, colors, etc.
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  eventId: text('event_id').references(() => events.id).notNull(),
  
  // Order Details
  items: jsonb('items').notNull(), // [{ productId, quantity, price }]
  subtotal: integer('subtotal').notNull(),
  shipping: integer('shipping').notNull(),
  total: integer('total').notNull(),
  
  // Payment
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  
  // Fulfillment
  printfulOrderId: text('printful_order_id'),
  fulfillmentStatus: text('fulfillment_status').notNull().default('pending'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Photos Table
export const photos = pgTable('photos', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  eventId: text('event_id').references(() => events.id).notNull(),
  
  // Photo Details
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  
  // Metadata
  uploadedBy: text('uploaded_by'), // guest name or 'anonymous'
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  fileSize: integer('file_size').notNull(),
  
  // AI Analysis
  isDuplicate: boolean('is_duplicate').default(false),
  qualityScore: integer('quality_score'), // 0-100
  faces: jsonb('faces'), // face detection data
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## 🎨 UI Components (Radix UI + Tailwind)

### **Button Component**
```typescript
// client/src/components/ui/button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

## 🔌 API Routes

### **Design Generation API**
```typescript
// server/routes/designs.ts

import { Router } from 'express';
import { generateDesign, getDesigns } from '../services/openai.service';
import { db } from '../db';
import { designs } from '../db/schema';

const router = Router();

// POST /api/designs/generate
router.post('/generate', async (req, res) => {
  try {
    const { eventId, type, prompt } = req.body;
    
    // Generate design with OpenAI
    const imageUrl = await generateDesign(prompt);
    
    // Save to database
    const [design] = await db.insert(designs).values({
      eventId,
      type,
      prompt,
      imageUrl,
      aiModel: 'dall-e-3',
      status: 'generated',
    }).returning();
    
    res.json({ success: true, design });
  } catch (error) {
    console.error('Design generation error:', error);
    res.status(500).json({ error: 'Failed to generate design' });
  }
});

// GET /api/designs/:eventId
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const eventDesigns = await db
      .select()
      .from(designs)
      .where(eq(designs.eventId, eventId));
    
    res.json({ designs: eventDesigns });
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

export default router;
```

---

## 🤖 OpenAI Service

```typescript
// server/services/openai.service.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateDesign(prompt: string): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a beautiful, elegant wedding decoration design: ${prompt}. 
               Style: Modern Alpine, Swiss Mountain Wedding. 
               Colors: Sage Green, Cream, Gold. 
               High quality, professional, printable.`,
      size: '1024x1024',
      quality: 'hd',
      n: 1,
    });
    
    return response.data[0].url!;
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw new Error('Failed to generate design');
  }
}

export async function generateMultipleDesigns(
  basePrompt: string,
  count: number = 5
): Promise<string[]> {
  const promises = Array.from({ length: count }, () => 
    generateDesign(basePrompt)
  );
  
  return Promise.all(promises);
}
```

---

## 📸 Photo Upload Service

```typescript
// server/services/photo.service.ts

import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadPhoto(
  buffer: Buffer,
  eventId: string
): Promise<{ url: string; publicId: string; metadata: any }> {
  try {
    // Optimize image
    const optimized = await sharp(buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    // Get metadata
    const metadata = await sharp(buffer).metadata();
    
    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `eventmerch/${eventId}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(optimized);
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
      },
    };
  } catch (error) {
    console.error('Photo upload error:', error);
    throw new Error('Failed to upload photo');
  }
}

export async function detectDuplicates(
  eventId: string,
  newPhotoHash: string
): Promise<boolean> {
  // TODO: Implement perceptual hashing for duplicate detection
  // Use libraries like 'imghash' or 'sharp' + 'hamming-distance'
  return false;
}
```

---

## 🚀 Nächste Schritte (Next Steps)

### **Jetzt starten**:
```bash
cd /Users/sherry/Documents/EventMerch
npm install
npm run dev
```

### **Sprint 1 Tasks** (Diese Woche):
1. [ ] Projektstruktur erstellen (client/ + server/)
2. [ ] Database Schema implementieren
3. [ ] UI-Komponenten-Bibliothek aufbauen
4. [ ] API-Routen Setup

**Soll ich anfangen, die Dateien zu erstellen?** 🚀
