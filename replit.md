# Image Weight Checker

## Overview

Image Weight Checker is a Shopify store optimization tool that analyzes product images and identifies heavy files that slow down page load times. The application scans store images, identifies oversized files (>500KB), and provides optimization capabilities including WebP conversion. It features a freemium model with 3 free daily optimizations and unlimited access for Pro subscribers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`
- Utility functions and API client in `client/src/lib/`

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful endpoints under `/api/*`
- **Session Management**: connect-pg-simple for PostgreSQL session storage

The backend follows a layered architecture:
- `server/index.ts`: Express app setup and middleware
- `server/routes.ts`: API route definitions
- `server/storage.ts`: Data access layer with repository pattern
- `server/db.ts`: Database connection configuration

### Data Model
Two primary tables:
1. **shops**: Stores domain information and scan timestamps
2. **imageLogs**: Tracks individual images with optimization status, sizes, and S3 backup keys

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: esbuild bundles server code, Vite builds client assets
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Cloud Storage (Planned)
- **AWS S3**: For backing up original images before optimization (referenced in schema but not yet implemented)

### Third-Party Services (Planned based on requirements doc)
- **Shopify Admin API**: For reading products and theme assets (mock implementation currently)
- **Image Compression Service**: WebP conversion at 80% quality

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack React Query**: Data fetching and caching
- **Embla Carousel**: Carousel functionality
- **react-day-picker**: Date selection
- **Recharts**: Chart visualization
- **Vaul**: Drawer component

### Build & Development
- **Vite**: Frontend build and dev server
- **esbuild**: Server-side bundling
- **TSX**: TypeScript execution for development