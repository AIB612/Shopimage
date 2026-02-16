import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image, 
  Zap, 
  Download, 
  Settings, 
  CreditCard, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  HardDrive
} from "lucide-react";

interface UserStats {
  imagesOptimized: number;
  dataSaved: number;
  usageCount: number;
  usageLimit: number;
  plan: string;
}

interface SyncStatus {
  shopify: { connected: boolean; lastSync: string | null; imageCount: number };
  woocommerce: { connected: boolean; lastSync: string | null; imageCount: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats>({
    imagesOptimized: 0,
    dataSaved: 0,
    usageCount: 0,
    usageLimit: 10,
    plan: "free"
  });
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    shopify: { connected: false, lastSync: null, imageCount: 0 },
    woocommerce: { connected: false, lastSync: null, imageCount: 0 }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Load user stats
      const token = localStorage.getItem("token");
      if (token) {
        const usageRes = await fetch("/api/usage", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usageRes.ok) {
          const usage = await usageRes.json();
          setStats(prev => ({
            ...prev,
            usageCount: usage.used || 0,
            usageLimit: usage.limit || 10,
            plan: usage.plan || "free"
          }));
        }

        // Load sync status
        const syncRes = await fetch("/api/sync/status", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (syncRes.ok) {
          const sync = await syncRes.json();
          setSyncStatus(sync);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const usagePercent = stats.usageLimit > 0 
    ? Math.min((stats.usageCount / stats.usageLimit) * 100, 100) 
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <a className="flex items-center gap-2 text-xl font-bold text-primary">
              <span className="text-2xl">🪼</span>
              Shopimage
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant={stats.plan === "free" ? "secondary" : "default"}>
              {stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)} Plan
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">Upgrade</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Images Optimized
              </CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.imagesOptimized}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Data Saved
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatBytes(stats.dataSaved)}</div>
              <p className="text-xs text-muted-foreground">total savings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usage
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.usageCount} / {stats.usageLimit === 999999 ? "∞" : stats.usageLimit}
              </div>
              <Progress 
                value={usagePercent} 
                className={`mt-2 ${usagePercent > 90 ? "bg-red-100" : usagePercent > 70 ? "bg-yellow-100" : ""}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Plan
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold capitalize">{stats.plan}</div>
              <p className="text-xs text-muted-foreground">
                {stats.plan === "free" ? (
                  <Link href="/pricing" className="text-primary hover:underline">
                    Upgrade for unlimited
                  </Link>
                ) : "Active"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sync" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sync">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync
            </TabsTrigger>
            <TabsTrigger value="history">
              <Zap className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Sync Tab */}
          <TabsContent value="sync">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shopify Sync */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#96bf48">
                        <path d="M15.337 3.415c-.193-.016-.374.092-.456.267l-.727 1.6-.727-1.6c-.082-.175-.263-.283-.456-.267-.193.016-.36.152-.417.34l-1.6 5.333c-.073.244.066.5.31.573.244.073.5-.066.573-.31l1.12-3.733.54 1.187c.073.16.233.267.41.267s.337-.107.41-.267l.54-1.187 1.12 3.733c.073.244.33.383.573.31.244-.073.383-.33.31-.573l-1.6-5.333c-.057-.188-.224-.324-.417-.34z"/>
                      </svg>
                      Shopify
                    </CardTitle>
                    {syncStatus.shopify.connected ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Sync and optimize your Shopify product images
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {syncStatus.shopify.connected ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Images synced:</span>
                        <span className="font-medium">{syncStatus.shopify.imageCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last sync:</span>
                        <span className="font-medium">
                          {syncStatus.shopify.lastSync || "Never"}
                        </span>
                      </div>
                      <Button className="w-full" onClick={() => handleSync("shopify")}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" variant="outline" asChild>
                      <a href="/api/shopify/connect">Connect Shopify Store</a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* WooCommerce Sync */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#96588a">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                      WooCommerce
                    </CardTitle>
                    {syncStatus.woocommerce.connected ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Sync and optimize your WooCommerce product images
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {syncStatus.woocommerce.connected ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Images synced:</span>
                        <span className="font-medium">{syncStatus.woocommerce.imageCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last sync:</span>
                        <span className="font-medium">
                          {syncStatus.woocommerce.lastSync || "Never"}
                        </span>
                      </div>
                      <Button className="w-full" onClick={() => handleSync("woocommerce")}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Optimization History</CardTitle>
                <CardDescription>Recent image optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No optimization history yet</p>
                  <p className="text-sm">Start optimizing images to see your history here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Settings</CardTitle>
                <CardDescription>Configure your default optimization preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Format</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="webp">WebP (Recommended)</option>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Quality</label>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    defaultValue="85"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smaller file</span>
                    <span>Higher quality</span>
                  </div>
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Made with 💚 in Switzerland 🇨🇭</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/pricing" className="hover:underline">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );

  async function handleSync(platform: "shopify" | "woocommerce") {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/sync/${platform}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
}
