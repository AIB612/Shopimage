import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, ImageIcon, ArrowRight, Lock } from "lucide-react";
import type { ImageAnalysis } from "@shared/schema";

interface ImageResultCardProps {
  image: ImageAnalysis;
  onFix: () => void;
  isFixing: boolean;
  index: number;
  canFix?: boolean;  // Whether user can still fix (hasn't exceeded free limit)
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  return `${(bytes / 1024).toFixed(0)}KB`;
}

export function ImageResultCard({ image, onFix, isFixing, index, canFix = true }: ImageResultCardProps) {
  const isOptimized = image.status === "optimized";
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
            <span className="text-2xl font-black text-foreground tracking-tighter">
              {formatBytes(image.originalSize)}
            </span>
            {isOptimized ? (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none font-bold text-[10px] uppercase">
                Fixed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5 font-bold text-[10px] uppercase">
                Heavy
              </Badge>
            )}
          </div>
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {isOptimized ? (
              <span className="text-green-600 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                {sizeSavingPercent}% space saved
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

        <div className="flex-shrink-0">
          {isOptimized ? (
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
