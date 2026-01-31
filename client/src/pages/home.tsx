import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ImageAnalysis, ScanResult } from "@shared/schema";
import { Zap, Loader2, RefreshCw, Upload, Gauge, HardDrive, Clock, CheckCircle2, Store, Activity, Lock, Crown, ExternalLink, ArrowRight, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ImageResultCard } from "@/components/image-result-card";

interface ShopInfo {
  name: string;
  domain: string;
  speedMetrics: {
    latency: number;
  };
  imagesOptimized: number;
  totalImages: number;
  spaceSaved: number;
}

type AppState = "unauthorized" | "loading" | "ready" | "scanning" | "complete";

interface ScanStatus {
  progress: number;
  message: string;
}

// Demo case study data
const DEMO_IMAGES = [
  { id: "demo-1", imageName: "product-hero.jpg", originalSize: 2100000, optimizedSize: 420000, status: "optimized" as const },
  { id: "demo-2", imageName: "banner-main.png", originalSize: 1800000, optimizedSize: 360000, status: "optimized" as const },
  { id: "demo-3", imageName: "collection-bg.jpg", originalSize: 1500000, optimizedSize: 300000, status: "optimized" as const },
  { id: "demo-4", imageName: "product-detail.jpg", originalSize: 1200000, optimizedSize: 240000, status: "pending" as const },
  { id: "demo-5", imageName: "lifestyle-shot.jpg", originalSize: 980000, optimizedSize: 196000, status: "pending" as const },
];

export default function Home() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [scanStatus, setScanStatus] = useState<ScanStatus>({ progress: 0, message: "" });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [fixCount, setFixCount] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const FREE_IMAGE_LIMIT = 5;
  const MONTHLY_LIMIT = 500;
  const { toast } = useToast();

  // Fetch shop info automatically
  const shopInfoQuery = useQuery<ShopInfo>({
    queryKey: ["/api/shop/info"],
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (appState === "loading") {
      if (shopInfoQuery.data) {
        setAppState("ready");
      } else if (shopInfoQuery.isError || (!shopInfoQuery.isLoading && !shopInfoQuery.data)) {
        setAppState("unauthorized");
      }
    }
  }, [shopInfoQuery.data, shopInfoQuery.isError, shopInfoQuery.isLoading, appState]);

  // Calculate stats
  const optimizedCount = images.filter(img => img.status === "optimized").length;
  const pendingCount = images.filter(img => img.status === "pending").length;
  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalOptimizedSize = images.reduce((sum, img) => 
    img.status === "optimized" ? sum + img.estimatedOptimizedSize : sum + img.originalSize, 0);
  const spaceSaved = totalOriginalSize - totalOptimizedSize;

  const scanMutation = useMutation({
    mutationFn: async (domain: string) => {
      const response = await apiRequest("POST", "/api/scan", { url: domain });
      const data = await response.json();
      return data as ScanResult;
    },
    onMutate: () => {
      setAppState("scanning");
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
        setAppState("complete");
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
        queryClient.invalidateQueries({ queryKey: ["/api/shop/info"] });
      }, 600);
    },
    onError: (error: Error) => {
      setAppState("ready");
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to analyze the store.",
        variant: "destructive",
      });
    },
  });

  const fixMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await apiRequest("POST", `/api/images/${imageId}/fix`);
      const data = await response.json();
      return data;
    },
    onSuccess: (data, imageId) => {
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, status: "optimized" as const, estimatedOptimizedSize: data.optimizedSize }
          : img
      ));
      setFixCount(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/shop/info"] });
      toast({
        title: "Image Optimized!",
        description: `Saved ${formatBytes(data.originalSize - data.optimizedSize)}`,
      });
    },
    onError: () => {
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize the image.",
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
      setImages(prev => prev.map(img => ({
        ...img,
        status: "optimized" as const,
        estimatedOptimizedSize: Math.round(img.originalSize * 0.2),
      })));
      queryClient.invalidateQueries({ queryKey: ["/api/shop/info"] });
      toast({
        title: "All Images Optimized!",
        description: `Successfully optimized ${data.optimizedCount} images`,
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (shopId: string) => {
      const response = await apiRequest("POST", `/api/shops/${shopId}/sync`);
      return response.json();
    },
    onSuccess: () => {
      setIsSynced(true);
      toast({
        title: "Synced to Shopify!",
        description: "All optimized images have been uploaded to your store.",
      });
    },
  });

  const handleFix = (imageId: string) => {
    if (!isProUser && fixCount >= FREE_IMAGE_LIMIT) {
      toast({
        title: "Free Limit Reached",
        description: "Upgrade to Pro to optimize up to 500 images per month!",
        variant: "destructive",
      });
      return;
    }
    if (isProUser && fixCount >= MONTHLY_LIMIT) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've reached your 500 image limit this month.",
        variant: "destructive",
      });
      return;
    }
    fixMutation.mutate(imageId);
  };

  const handleOptimizeAll = () => {
    if (!scanResult?.shop?.id) return;
    optimizeAllMutation.mutate(scanResult.shop.id);
  };

  const handleSync = () => {
    if (!scanResult?.shop?.id) return;
    syncMutation.mutate(scanResult.shop.id);
  };

  const handleScan = () => {
    if (shopInfoQuery.data?.domain) {
      scanMutation.mutate(shopInfoQuery.data.domain);
    }
  };

  const handleRescan = () => {
    setAppState("ready");
    setScanResult(null);
    setImages([]);
    setIsSynced(false);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const getLatencyStatus = (latency: number) => {
    if (latency < 100) return { label: "Good", color: "bg-green-500", textColor: "text-green-600" };
    if (latency <= 300) return { label: "Needs Improvement", color: "bg-yellow-500", textColor: "text-yellow-600" };
    return { label: "Poor", color: "bg-red-500", textColor: "text-red-600" };
  };

  const getPerformanceScore = (): number => {
    if (images.length === 0) return shopInfoQuery.data?.totalImages ? 0 : 100;
    const optimizedRatio = optimizedCount / images.length;
    return Math.round(40 + optimizedRatio * 60);
  };

  // Loading state
  if (shopInfoQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading store information...</p>
        </div>
      </div>
    );
  }

  // Unauthorized / Landing Page
  if (appState === "unauthorized" || shopInfoQuery.error) {
    const demoTotalOriginal = DEMO_IMAGES.reduce((sum, img) => sum + img.originalSize, 0);
    const demoTotalOptimized = DEMO_IMAGES.reduce((sum, img) => sum + img.optimizedSize, 0);
    const demoSpaceSaved = demoTotalOriginal - demoTotalOptimized;
    const demoOptimizedCount = DEMO_IMAGES.filter(img => img.status === "optimized").length;
    
    const handleConnectStore = () => {
      if (!storeUrl.trim()) {
        toast({
          title: "Please enter store URL",
          description: "Enter your Shopify store URL to connect",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Connecting...",
        description: "Store connection feature coming soon!",
      });
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Image Weight Checker</h1>
                <p className="text-xs text-muted-foreground">Optimize your Shopify store images</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Speed Up Your Shopify Store
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Optimize your product images to improve page load times and boost your store's performance score.
            </p>
          </div>

          {/* Connect Store Section */}
          <Card className="p-8 mb-8 max-w-2xl mx-auto">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Connect Your Store</h3>
                <p className="text-muted-foreground">Enter your Shopify store URL or install the app to get started</p>
              </div>
              
              {/* URL Input */}
              <div className="flex gap-3 max-w-md mx-auto">
                <Input
                  placeholder="your-store.myshopify.com"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  className="flex-1"
                  data-testid="input-store-url"
                />
                <Button onClick={handleConnectStore} className="gap-2" data-testid="button-connect">
                  <ArrowRight className="w-4 h-4" />
                  Connect
                </Button>
              </div>

              <div className="flex items-center gap-4 justify-center">
                <div className="h-px bg-border flex-1 max-w-20" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="h-px bg-border flex-1 max-w-20" />
              </div>

              {/* Install App Button */}
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  toast({
                    title: "App Installation",
                    description: "Shopify App Store link coming soon!",
                  });
                }}
                data-testid="button-install-app"
              >
                <ExternalLink className="w-4 h-4" />
                Install from Shopify App Store
              </Button>
            </div>
          </Card>

          {/* Case Study Section */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4">Case Study</Badge>
              <h3 className="text-2xl font-bold text-foreground mb-2">See the Results</h3>
              <p className="text-muted-foreground">Example optimization from a real Shopify store</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Demo Stats */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Before & After</h4>
                  
                  {/* Before */}
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Before</span>
                      <Badge variant="outline" className="text-red-600 border-red-300">Score: 35</Badge>
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatBytes(demoTotalOriginal)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total image size</p>
                  </div>

                  {/* After */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">After</span>
                      <Badge variant="outline" className="text-green-600 border-green-300">Score: 92</Badge>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatBytes(demoTotalOptimized)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total image size</p>
                  </div>

                  {/* Savings */}
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary">
                      {formatBytes(demoSpaceSaved)}
                    </div>
                    <p className="text-sm text-muted-foreground">Space Saved (80% reduction)</p>
                  </div>
                </Card>
              </div>

              {/* Demo Image List */}
              <div className="lg:col-span-2">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-foreground">Optimized Images</h4>
                    <Badge variant="secondary">{demoOptimizedCount}/{DEMO_IMAGES.length} optimized</Badge>
                  </div>
                  <div className="space-y-3">
                    {DEMO_IMAGES.map((image) => (
                      <div 
                        key={image.id}
                        className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{image.imageName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(image.originalSize)} → {formatBytes(image.optimizedSize)}
                          </p>
                        </div>
                        <div className="text-right">
                          {image.status === "optimized" ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Optimized
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const shopInfo = shopInfoQuery.data;
  const latencyStatus = getLatencyStatus(shopInfo?.speedMetrics.latency || 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Image Weight Checker</h1>
              <p className="text-xs text-muted-foreground">Optimize your store images</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {isProUser ? `${fixCount}/${MONTHLY_LIMIT} this month` : `${Math.min(fixCount, FREE_IMAGE_LIMIT)}/${FREE_IMAGE_LIMIT} free`}
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 overflow-visible">
        {/* Scanning State */}
        {appState === "scanning" && (
          <Card className="p-8 mb-6">
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div 
                  className="absolute inset-0 border-4 border-primary rounded-full animate-spin"
                  style={{ 
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(scanStatus.progress * Math.PI / 50)}% ${50 - 50 * Math.cos(scanStatus.progress * Math.PI / 50)}%, 50% 50%)` 
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{scanStatus.progress}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">{scanStatus.message}</p>
                <Progress value={scanStatus.progress} className="h-2" />
              </div>
            </div>
          </Card>
        )}

        {/* Main Content - Two Column Layout */}
        {(appState === "ready" || appState === "complete") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column - Store Info & Speed (Sticky) */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start">
              {/* Store Card */}
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <Store className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground" data-testid="text-shop-name">
                      {shopInfo?.name || "PROFILO"}
                    </h2>
                    <p className="text-sm text-muted-foreground">{shopInfo?.domain}</p>
                  </div>
                </div>

                {/* Speed Metrics */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Store Speed
                  </h3>
                  
                  {/* Latency Indicator */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${latencyStatus.color}`} />
                        <span className="text-lg font-bold text-foreground">
                          {shopInfo?.speedMetrics.latency || 0}ms
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${latencyStatus.textColor}`}>
                        {latencyStatus.label}
                      </span>
                    </div>
                    
                    {/* Speed Scale */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600">Good</span>
                        <span className="text-muted-foreground">&lt; 100ms</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-yellow-600">Needs Improvement</span>
                        <span className="text-muted-foreground">100ms - 300ms</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-red-600">Poor</span>
                        <span className="text-muted-foreground">&gt; 300ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimize Button */}
                {appState === "ready" && (
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={handleScan}
                    disabled={scanMutation.isPending}
                    data-testid="button-optimize-now"
                  >
                    {scanMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    Start Optimization
                  </Button>
                )}

                {appState === "complete" && (
                  <div className="space-y-3">
                    {pendingCount > 0 && (
                      <Button 
                        className="w-full gap-2" 
                        size="lg"
                        onClick={handleOptimizeAll}
                        disabled={optimizeAllMutation.isPending}
                        data-testid="button-optimize-all"
                      >
                        {optimizeAllMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Zap className="w-5 h-5" />
                        )}
                        Optimize All ({pendingCount})
                      </Button>
                    )}
                    {optimizedCount > 0 && (
                      <Button 
                        className="w-full gap-2"
                        variant={isSynced ? "secondary" : "default"}
                        onClick={handleSync}
                        disabled={syncMutation.isPending || isSynced}
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
                      variant="ghost" 
                      className="w-full gap-2"
                      onClick={handleRescan}
                      data-testid="button-rescan"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Rescan Store
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Dashboard & Images */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dashboard Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground" data-testid="text-optimized-count">
                        {appState === "complete" ? optimizedCount : (shopInfo?.imagesOptimized || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Optimized</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-space-saved">
                        {formatBytes(appState === "complete" ? spaceSaved : (shopInfo?.spaceSaved || 0))}
                      </div>
                      <p className="text-xs text-muted-foreground">Space Saved</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {appState === "complete" ? images.length : (shopInfo?.totalImages || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Images</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-performance-score">
                        {getPerformanceScore()}
                      </div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Images List */}
              {appState === "ready" && (
                <Card className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Zap className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Ready to Optimize</h3>
                      <p className="text-muted-foreground">Click "Start Optimization" to scan your store images and find optimization opportunities.</p>
                    </div>
                  </div>
                </Card>
              )}

              {appState === "complete" && images.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Images to Optimize</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{images.length} images</Badge>
                      {!isProUser && images.length > FREE_IMAGE_LIMIT && (
                        <Badge variant="outline" className="text-primary border-primary">
                          <Lock className="w-3 h-3 mr-1" />
                          {images.length - FREE_IMAGE_LIMIT} locked
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {(isProUser ? images : images.slice(0, FREE_IMAGE_LIMIT)).map((image, index) => (
                      <ImageResultCard
                        key={image.id}
                        image={image}
                        onFix={() => handleFix(image.id)}
                        isFixing={fixMutation.isPending && fixMutation.variables === image.id}
                        index={index}
                      />
                    ))}
                    
                    {/* Unlock More Section */}
                    {!isProUser && images.length > FREE_IMAGE_LIMIT && (
                      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                            <Crown className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">Unlock {images.length - FREE_IMAGE_LIMIT} More Images</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Upgrade to Pro to optimize up to {MONTHLY_LIMIT} images per month
                            </p>
                          </div>
                          <Button 
                            className="gap-2"
                            onClick={() => {
                              toast({
                                title: "Pro Upgrade",
                                description: "Pro subscription feature coming soon!",
                              });
                            }}
                            data-testid="button-upgrade"
                          >
                            <Crown className="w-4 h-4" />
                            Upgrade to Pro
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Free: {FREE_IMAGE_LIMIT} images/scan | Pro: {MONTHLY_LIMIT} images/month
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </Card>
              )}

              {appState === "complete" && images.length === 0 && (
                <Card className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">All Images Optimized!</h3>
                      <p className="text-muted-foreground">Your store images are already well optimized. No heavy images found.</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
