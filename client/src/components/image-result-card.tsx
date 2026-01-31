import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, ImageIcon } from "lucide-react";
import type { ImageAnalysis } from "@shared/schema";

interface ImageResultCardProps {
  image: ImageAnalysis;
  onFix: () => void;
  isFixing: boolean;
  index: number;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  return `${(bytes / 1024).toFixed(0)}KB`;
}

export function ImageResultCard({ image, onFix, isFixing, index }: ImageResultCardProps) {
  const isOptimized = image.status === "optimized";
  const sizeSaving = image.originalSize - image.estimatedOptimizedSize;
  const sizeSavingPercent = Math.round((sizeSaving / image.originalSize) * 100);
  
  return (
    <Card className="p-4 bg-card shadow-sm hover-elevate">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {image.imageUrl ? (
            <img
              src={image.imageUrl}
              alt={image.imageName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg></div>';
              }}
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-foreground">
              {formatBytes(image.originalSize)}
            </span>
            {isOptimized && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                Optimized
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {isOptimized ? (
              <>Reduced to {formatBytes(image.estimatedOptimizedSize)} ({sizeSavingPercent}% smaller)</>
            ) : (
              <>
                Shrink to {formatBytes(image.estimatedOptimizedSize)}: Boost Speed by {image.timeSaved.toFixed(1)}s
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {image.imageName}
          </p>
        </div>

        <div className="flex-shrink-0">
          {isOptimized ? (
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <Button
              onClick={onFix}
              disabled={isFixing}
              variant="outline"
              className="gap-2"
              data-testid={`button-fix-${index}`}
            >
              {isFixing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Optimize Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
