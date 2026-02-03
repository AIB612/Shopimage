import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ImageAnalysis, ScanResult } from "@shared/schema";
import { Zap, Loader2, RefreshCw, Upload, Gauge, HardDrive, Clock, CheckCircle2, Store, Activity, Lock, Crown, ExternalLink, ArrowRight, ImageIcon, Sparkles, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ImageResultCard } from "@/components/image-result-card";
import { UpgradeModal } from "@/components/upgrade-modal";

// Logo URL fallback (using a placeholder or direct public path if possible)
const LOGO_URL = "/logo.svg";

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

const DEMO_IMAGES = [
  { id: "demo-1", imageName: "hero-slider-autumn.jpg", originalSize: 3200000, optimizedSize: 640000, status: "optimized" as const, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop" },
  { id: "demo-2", imageName: "product-gallery-01.png", originalSize: 1500000, optimizedSize: 300000, status: "optimized" as const, imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=100&h=100&fit=crop" },
  { id: "demo-3", imageName: "collection-grid-bg.webp", originalSize: 2100000, optimizedSize: 420000, status: "pending" as const, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop" },
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const FREE_IMAGE_LIMIT = 5;
  const { toast } = useToast();

  const shopInfoQuery = useQuery<ShopInfo>({
    queryKey: ["/api/shop/info"],
    refetchOnWindowFocus: false,
    retry: 1,
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

  const scanMutation = useMutation({
    mutationFn: async (domain: string) => {
      const response = await apiRequest("POST", "/api/scan", { url: domain });
      if (!response.ok) throw new Error("Failed to scan store");
      return await response.json() as ScanResult;
    },
    onMutate: () => {
      setAppState("scanning");
      setScanStatus({ progress: 0, message: "Connecting to Shopify..." });
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p >= 95) clearInterval(interval);
        setScanStatus(s => ({ ...s, progress: Math.min(p, 95) }));
      }, 200);
      return { interval };
    },
    onSuccess: (data, variables, context) => {
      if (context?.interval) clearInterval(context.interval);
      setScanStatus({ progress: 100, message: "Analysis successful!" });
      
      setTimeout(() => {
        setAppState("complete");
        setScanResult(data);
        const analysisImages: ImageAnalysis[] = (data?.images || []).map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          imageName: img.imageName,
          originalSize: img.originalSize,
          estimatedOptimizedSize: img.optimizedSize || Math.round(img.originalSize * 0.25),
          format: img.format,
          timeSaved: (img.originalSize * 0.8 / 1024 / 1024) / 1.5,
          status: (img.status || "pending") as any,
        }));
        setImages(analysisImages);
        toast({ title: "Scan Complete", description: `Found ${analysisImages.length} images to optimize.` });
      }, 500);
    },
    onError: (error: Error, variables, context) => {
      if (context?.interval) clearInterval(context.interval);
      setAppState("unauthorized");
      toast({ title: "Scan Failed", description: error.message, variant: "destructive" });
    },
  });

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const handleConnectStore = () => {
    if (!storeUrl.trim()) {
      toast({ title: "Enter URL", description: "Please enter your .myshopify.com store link.", variant: "destructive" });
      return;
    }
    const cleanDomain = storeUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    
    // Always run scan first - it will return demo data if no real token
    scanMutation.mutate(cleanDomain);
  };
  
  // Function to start OAuth install flow
  const handleInstallApp = () => {
    const cleanDomain = storeUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    if (cleanDomain.endsWith(".myshopify.com")) {
      window.location.href = `/api/shopify/install?shop=${cleanDomain}`;
    } else {
      toast({ title: "Invalid Domain", description: "Please enter a valid .myshopify.com store URL.", variant: "destructive" });
    }
  };

  // UI Components
  const Header = () => (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center p-1">
            <img src={LOGO_URL} alt="Shopimage" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-black uppercase">Shopimage</h1>
            <Badge variant="secondary" className="text-[10px] h-4 font-bold bg-primary/10 text-primary border-none">BETA v2.0</Badge>
          </div>
        </div>
        {appState === "complete" && (
          <Button variant="outline" size="sm" onClick={() => setAppState("ready")} className="rounded-xl font-bold">New Scan</Button>
        )}
      </div>
    </header>
  );

  if (appState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-black rounded-3xl mb-4 mx-auto flex items-center justify-center animate-pulse">
             <Sparkles className="text-white w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Waking up...</p>
        </div>
      </div>
    );
  }

  if (appState === "unauthorized" || appState === "ready") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center text-left">
            <div className="space-y-8">
              <Badge className="bg-primary text-white font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">NEW: AI ENGINE ACTIVATED</Badge>
              <h2 className="text-6xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                Stop Losing <span className="text-primary italic">Sales</span> to Slow Loading.
              </h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                One-click image weight reduction for Shopify. Higher conversion, better SEO, zero effort.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-slate-200 ring-4 ring-white/50 focus-within:ring-primary/10 transition-all">
                <Input 
                  placeholder="your-store.myshopify.com" 
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnectStore()}
                  className="h-14 border-none bg-transparent text-lg font-bold px-8 focus-visible:ring-0 placeholder:text-slate-300"
                />
                <Button 
                  onClick={handleConnectStore}
                  className="h-14 px-10 rounded-[2rem] font-black text-lg bg-black hover:bg-primary transition-all active:scale-95 shadow-xl shadow-black/20"
                >
                  Analyze Now <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </div>
            </div>

            <div className="relative">
               <Card className="p-8 border-none shadow-2xl bg-white/40 backdrop-blur-xl relative z-10 rounded-[2rem] overflow-hidden border border-white">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-xl tracking-tight uppercase">Live Case Study</h4>
                    <TrendingUp className="text-green-500 w-6 h-6" />
                  </div>
                  <div className="space-y-6">
                    {DEMO_IMAGES.map(img => (
                      <div key={img.id} className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/50">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                          <img src={img.imageUrl} alt={img.imageName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-24 bg-slate-200 rounded-full mb-2" />
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-slate-400 line-through">{formatBytes(img.originalSize)}</span>
                             <ArrowRight className="w-3 h-3 text-slate-300" />
                             <span className="text-xs font-black text-green-600 bg-green-500/10 px-2 py-0.5 rounded">{formatBytes(img.optimizedSize)}</span>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white font-black rounded-lg border-none">FIXED</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-200/50 flex items-center justify-between">
                     <div>
                       <p className="text-xs font-black text-slate-400 uppercase mb-1">Performance Gain</p>
                       <p className="text-3xl font-black text-green-500">+88% Score</p>
                     </div>
                     <div className="text-right">
                       <p className="text-xs font-black text-slate-400 uppercase mb-1">Time Saved</p>
                       <p className="text-3xl font-black text-black">2.4s</p>
                     </div>
                  </div>
               </Card>
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[100px] -z-10" />
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-[100px] -z-10" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (appState === "scanning") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-12 text-center rounded-[3rem] border-none shadow-2xl bg-white animate-in slide-in-from-bottom-10 duration-700">
           <div className="relative w-32 h-32 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * scanStatus.progress) / 100} className="text-primary transition-all duration-300 stroke-round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-3xl">{scanStatus.progress}%</div>
           </div>
           <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">{scanStatus.message}</h3>
           <p className="text-slate-400 font-medium">Brewing your performance report...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
            <Card className="p-8 rounded-[2rem] border-none shadow-xl bg-black text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-20"><Store className="w-12 h-12" /></div>
               <div className="mb-8">
                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Analyzing Store</p>
                 <h2 className="text-3xl font-black tracking-tighter truncate">{scanResult?.shop?.domain || "Your Store"}</h2>
               </div>
               <div className="space-y-6">
                  <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2 text-xs font-bold uppercase text-slate-400">
                      <span>Latency Score</span>
                      <span className="text-green-400">Excellent</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                       <span className="text-4xl font-black">150ms</span>
                    </div>
                  </div>
                  <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-primary/30">
                    Optimize Everything <Zap className="ml-2 w-5 h-5 fill-current" />
                  </Button>
                  {scanResult?.shop?.domain?.endsWith(".myshopify.com") && !scanResult?.shop?.accessToken && (
                    <Button 
                      variant="outline" 
                      className="w-full h-12 rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold"
                      onClick={handleInstallApp}
                    >
                      <Lock className="mr-2 w-4 h-4" /> Connect Real Store Data
                    </Button>
                  )}
               </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Detected", val: images.length, icon: ImageIcon, color: "text-blue-500" },
                  { label: "Heavy", val: images.filter(i => i.originalSize > 1024*1024).length, icon: Gauge, color: "text-red-500" },
                  { label: "Saving", val: "1.2GB", icon: HardDrive, color: "text-green-500" },
                  { label: "Grade", val: "D-", icon: CheckCircle2, color: "text-orange-500" },
                ].map((stat, i) => (
                  <Card key={i} className="p-5 rounded-3xl border-none shadow-md bg-white text-center group hover:shadow-xl transition-all">
                    <stat.icon className={`mx-auto mb-3 w-6 h-6 ${stat.color}`} />
                    <p className="text-2xl font-black tracking-tight">{stat.val}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                  </Card>
                ))}
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black uppercase tracking-tight">Optimization Queue</h3>
                  <Badge variant="outline" className="border-slate-300 font-bold">{images.length} TOTAL</Badge>
                </div>
                {images.map((image, index) => (
                  <ImageResultCard
                    key={image.id}
                    image={image}
                    onFix={() => setFixCount(f => f + 1)}
                    isFixing={false}
                    index={index}
                  />
                ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
