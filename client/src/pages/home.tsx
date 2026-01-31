import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ImageAnalysis, ScanResult } from "@shared/schema";
import { Search, Zap, Loader2, RefreshCw, Sparkles, TrendingDown, Upload, Gauge, HardDrive, Clock, CheckCircle2 } from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";
import { ImageResultCard } from "@/components/image-result-card";

type ScanState = "idle" | "scanning" | "complete";

interface ScanStatus {
  progress: number;
  message: string;
}

export default function Home() {
  const [storeUrl, setStoreUrl] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanStatus, setScanStatus] = useState<ScanStatus>({ progress: 0, message: "" });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [fixCount, setFixCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const { toast } = useToast();

  // Calculate stats
  const optimizedCount = images.filter(img => img.status === "optimized").length;
  const pendingCount = images.filter(img => img.status === "pending").length;
  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalOptimizedSize = images.reduce((sum, img) => 
    img.status === "optimized" ? sum + img.estimatedOptimizedSize : sum + img.originalSize, 0);
  const spaceSaved = totalOriginalSize - totalOptimizedSize;

  const scanMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/scan", { url });
      const data = await response.json();
      return data as ScanResult;
    },
    onMutate: () => {
      setScanState("scanning");
      setScanStatus({ progress: 0, message: "Connecting to store..." });
      
      const progressSteps = [
        { progress: 15, message: "Fetching product images...", delay: 800 },
        { progress: 35, message: "Analyzing theme assets...", delay: 1200 },
        { progress: 55, message: "Measuring file sizes...", delay: 1000 },
        { progress: 75, message: "Calculating optimizations...", delay: 900 },
        { progress: 90, message: "Generating report...", delay: 700 },
      ];

      let currentStep = 0;
      const runStep = () => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          setScanStatus({ progress: step.progress, message: step.message });
          currentStep++;
          setTimeout(runStep, step.delay);
        }
      };
      setTimeout(runStep, 500);
    },
    onSuccess: (data) => {
      setScanStatus({ progress: 100, message: "Complete!" });
      setTimeout(() => {
        setScanState("complete");
        setScanResult(data);
        
        const imageList = data?.images || [];
        const analysisImages: ImageAnalysis[] = imageList.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          imageName: img.imageName,
          originalSize: img.originalSize,
          estimatedOptimizedSize: img.optimizedSize || Math.round(img.originalSize * 0.2),
          format: img.format,
          timeSaved: ((img.originalSize - (img.optimizedSize || img.originalSize * 0.2)) / 1024 / 1024) / 1.5,
          status: img.status,
        }));
        setImages(analysisImages);
      }, 600);
    },
    onError: (error: Error) => {
      setScanState("idle");
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to analyze the store. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const fixMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await apiRequest("POST", `/api/images/${imageId}/fix`);
      const data = await response.json();
      return data as ImageAnalysis;
    },
    onSuccess: (data, imageId) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, status: "optimized" } : img
        )
      );
      setFixCount((prev) => prev + 1);
      toast({
        title: "Image Optimized",
        description: "The image has been compressed and updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize the image.",
        variant: "destructive",
      });
    },
  });

  const optimizeAllMutation = useMutation({
    mutationFn: async (shopId: string) => {
      const response = await apiRequest("POST", `/api/shops/${shopId}/optimize-all`);
      return response.json();
    },
    onSuccess: (data) => {
      setImages((prev) =>
        prev.map((img) => ({ ...img, status: "optimized" as const }))
      );
      setFixCount((prev) => prev + data.optimizedCount);
      toast({
        title: "All Images Optimized",
        description: `Successfully optimized ${data.optimizedCount} images.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize images.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (shopId: string) => {
      const response = await apiRequest("POST", `/api/shops/${shopId}/sync`);
      return response.json();
    },
    onSuccess: (data) => {
      setIsSynced(true);
      toast({
        title: "Sync Complete",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync to Shopify.",
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (!storeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your Shopify store URL.",
        variant: "destructive",
      });
      return;
    }
    scanMutation.mutate(storeUrl);
  };

  const handleFix = (imageId: string) => {
    if (fixCount >= 3) {
      setShowUpgradeModal(true);
      return;
    }
    fixMutation.mutate(imageId);
  };

  const handleReset = () => {
    setScanState("idle");
    setScanResult(null);
    setImages([]);
    setStoreUrl("");
    setFixCount(0);
    setIsSynced(false);
  };

  const handleOptimizeAll = () => {
    if (!scanResult?.shop?.id) return;
    optimizeAllMutation.mutate(scanResult.shop.id);
  };

  const handleSync = () => {
    if (!scanResult?.shop?.id) return;
    syncMutation.mutate(scanResult.shop.id);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const getPerformanceScore = (): number => {
    if (images.length === 0) return 100;
    const optimizedRatio = optimizedCount / images.length;
    return Math.round(40 + optimizedRatio * 60);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-500";
      case "B": return "text-lime-500";
      case "C": return "text-yellow-500";
      case "D": return "text-orange-500";
      case "F": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const totalHeavyImages = scanResult?.totalHeavyImages ?? 0;
  const potentialTimeSaved = scanResult?.potentialTimeSaved ?? 0;
  const grade = scanResult?.grade ?? "N/A";

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <Sparkles className="w-8 h-8 text-primary/30" />
      </div>
      <div className="absolute bottom-4 left-4">
        <Sparkles className="w-6 h-6 text-primary/20" />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
            IMAGE WEIGHT CHECKER
          </h1>
          <p className="text-lg text-muted-foreground">
            Find & Fix Slow Images Instantly
          </p>
        </header>

        {scanState === "idle" && (
          <div className="space-y-8">
            <Card className="p-2 bg-card shadow-lg">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Enter your Shopify store URL"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    className="pl-12 h-14 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    data-testid="input-store-url"
                  />
                </div>
                <Button
                  onClick={handleScan}
                  disabled={scanMutation.isPending}
                  className="h-14 px-8 text-base font-semibold"
                  data-testid="button-analyze"
                >
                  {scanMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "ANALYZE"
                  )}
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center hover-elevate">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Scan</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your store URL and we'll analyze all images
                </p>
              </Card>
              <Card className="p-6 text-center hover-elevate">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Analyze</h3>
                <p className="text-sm text-muted-foreground">
                  Find heavy images slowing down your site
                </p>
              </Card>
              <Card className="p-6 text-center hover-elevate">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Optimize</h3>
                <p className="text-sm text-muted-foreground">
                  One-click compression to WebP format
                </p>
              </Card>
            </div>
          </div>
        )}

        {scanState === "scanning" && (
          <Card className="p-8 bg-card shadow-lg">
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Scanning Your Store</h2>
                <p className="text-muted-foreground">{scanStatus.message}</p>
              </div>
              <Progress value={scanStatus.progress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground">
                {scanStatus.progress}% complete
              </p>
            </div>
          </Card>
        )}

        {scanState === "complete" && scanResult && (
          <div className="space-y-6">
            {/* Performance Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{optimizedCount}/{images.length}</div>
                    <p className="text-xs text-muted-foreground">Images Optimized</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatBytes(spaceSaved)}</div>
                    <p className="text-xs text-muted-foreground">Space Saved</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{potentialTimeSaved.toFixed(1)}s</div>
                    <p className="text-xs text-muted-foreground">Load Time Saved</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{getPerformanceScore()}</div>
                    <p className="text-xs text-muted-foreground">Performance Score</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Grade and Actions Card */}
            <Card className="p-6 bg-card shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getGradeColor(grade)}`}>
                      {grade}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Grade</p>
                  </div>
                  <div className="h-16 w-px bg-border hidden md:block" />
                  <div className="text-center md:text-left">
                    <div className="text-lg font-medium text-foreground">
                      {formatBytes(totalOriginalSize)} total
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {optimizedCount > 0 ? `Now ${formatBytes(totalOptimizedSize)}` : "Before optimization"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {pendingCount > 0 && (
                    <Button
                      onClick={handleOptimizeAll}
                      disabled={optimizeAllMutation.isPending}
                      className="gap-2"
                      data-testid="button-optimize-all"
                    >
                      {optimizeAllMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Optimize All ({pendingCount})
                    </Button>
                  )}
                  {optimizedCount > 0 && (
                    <Button
                      variant={isSynced ? "secondary" : "outline"}
                      onClick={handleSync}
                      disabled={syncMutation.isPending || isSynced}
                      className="gap-2"
                      data-testid="button-sync"
                    >
                      {syncMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSynced ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isSynced ? "Synced" : "Sync to Shopify"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-2"
                    data-testid="button-new-scan"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Scan
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  TOP {Math.min(images.length, 5)} HEAVY IMAGES
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {fixCount}/3 free fixes used
                </Badge>
              </div>
              
              <div className="space-y-3">
                {images.map((image, index) => (
                  <ImageResultCard
                    key={image.id}
                    image={image}
                    onFix={() => handleFix(image.id)}
                    isFixing={fixMutation.isPending && fixMutation.variables === image.id}
                    index={index}
                  />
                ))}
              </div>

              {images.length > 10 && (
                <Card className="p-4 text-center bg-muted/50">
                  <p className="text-muted-foreground">
                    Showing {images.length} heavy images.{" "}
                    <button
                      className="text-primary font-medium hover:underline"
                      onClick={() => setShowUpgradeModal(true)}
                      data-testid="button-view-all"
                    >
                      Upgrade for unlimited scans
                    </button>
                  </p>
                </Card>
              )}
            </div>

            <footer className="text-center pt-6">
              <p className="text-sm text-muted-foreground">
                Powered by Lightonoge API
              </p>
            </footer>
          </div>
        )}

        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </div>
    </div>
  );
}
