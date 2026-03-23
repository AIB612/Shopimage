import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, ImageIcon, ArrowRight, Lock } from "lucide-react";
import type { ImageAnalysis } from "@shared/schema";

// Shopify icon SVG component
const ShopifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.337 3.415c-.022-.165-.165-.247-.275-.258-.11-.011-2.447-.176-2.447-.176s-1.623-1.612-1.8-1.789c-.177-.176-.522-.124-.656-.082-.022 0-.297.088-.77.242-.462-1.327-1.276-2.548-2.711-2.548-.077 0-.165 0-.253.011C6.07-.561 5.608-.22 5.19.22c-1.276 1.392-1.788 3.477-1.975 5.243-.99.308-1.689.528-1.777.55-.55.176-.567.187-.633.704-.055.385-1.491 11.476-1.491 11.476L13.65 20.5l6.35-1.37s-4.641-15.55-4.663-15.715zM11.13 4.656l-1.975.605c0-.484-.066-1.173-.22-1.95.55.11.935.715 1.195 1.345zm-2.447.748l-2.14.66c.209-.814.605-1.623 1.09-2.151.176-.198.429-.418.715-.55.286.572.352 1.381.335 2.041zm-1.623-2.777c.231 0 .44.044.627.132-.275.143-.539.363-.781.627-.638.693-1.129 1.777-1.326 2.822l-1.777.55c.352-1.876 1.722-4.12 3.257-4.131z"/>
    <path d="M15.062 3.157c-.11-.011-2.447-.176-2.447-.176s-1.623-1.612-1.8-1.789c-.066-.066-.154-.099-.242-.121l-.88 17.929 6.35-1.37s-4.641-15.55-4.663-15.715c-.022-.165-.165-.247-.275-.258l-.043-.5z"/>
  </svg>
);

interface ImageResultCardProps {
  image: ImageAnalysis;
  onFix: () => void;
  onSync?: () => void;
  isFixing: boolean;
  isSyncing?: boolean;
  index: number;
  canFix?: boolean;  // Whether user can still fix (hasn't exceeded free limit)
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  return `${(bytes / 1024).toFixed(0)}KB`;
}

export function ImageResultCard({ image, onFix, onSync, isFixing, isSyncing = false, index, canFix = true }: ImageResultCardProps) {
  const isOptimized = image.status === "optimized";
  const isSynced = (image as any).syncStatus === "synced";
  const sizeSaving = image.originalSize - image.estimatedOptimizedSize;
  const sizeSavingPercent = Math.round((sizeSaving / image.originalSize) * 100);
  
  return (
    <Card className="p-5 bg-card shadow-md border-none hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center gap-5">
        <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-2xl overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-primary/20 transition-all">
          {image.imageUrl ? (
            <img
              src={image.imageUrl}
              alt={image.imageName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-8 h-8 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg></div>';
              }}
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {isOptimized ? (
              <>
                <span className="text-lg font-bold text-muted-foreground line-through">
                  {formatBytes(image.originalSize)}
                </span>
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-black text-green-600 tracking-tighter">
                  {formatBytes(image.estimatedOptimizedSize)}
                </span>
                <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none font-bold text-[10px] uppercase">
                  -{sizeSavingPercent}%
                </Badge>
              </>
            ) : (
              <>
                <span className="text-2xl font-black text-foreground tracking-tighter">
                  {formatBytes(image.originalSize)}
                </span>
                <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5 font-bold text-[10px] uppercase">
                  Heavy
                </Badge>
              </>
            )}
          </div>
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {isOptimized ? (
              <span className="text-green-600 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Saved {formatBytes(sizeSaving)}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3 text-primary" />
                Target: {formatBytes(image.estimatedOptimizedSize)}
              </span>
            )}
            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
            <span className="truncate max-w-[150px]">{image.imageName}</span>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {isOptimized && !isSynced && onSync ? (
            <Button
              onClick={onSync}
              disabled={isSyncing}
              size="sm"
              variant="outline"
              className="gap-2 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/5 transition-all"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShopifyIcon className="w-4 h-4" />
                  Sync
                </>
              )}
            </Button>
          ) : isOptimized && isSynced ? (
            <Badge className="bg-primary text-white font-bold px-3 py-1">
              <Check className="w-3 h-3 mr-1" /> Synced
            </Badge>
          ) : isOptimized ? (
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          ) : !canFix ? (
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
          ) : (
            <Button
              onClick={onFix}
              disabled={isFixing}
              size="sm"
              className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
              data-testid={`button-fix-${index}`}
            >
              {isFixing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Fix
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
