import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoImage from "@assets/水母_1769859103227.png";

interface PageLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
}

export function PageLayout({ children, showBackButton = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 flex items-center justify-center p-1">
                <img src={logoImage} alt="Shopimage" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-black uppercase">Shopimage</h1>
                <Badge variant="secondary" className="text-[10px] h-4 font-bold bg-primary/10 text-primary border-none">
                  BETA v2.0
                </Badge>
              </div>
            </a>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/faq">
              <a className="text-slate-600 hover:text-black transition-colors font-medium">FAQ</a>
            </Link>
            <a 
              href="https://chromewebstore.google.com/detail/shopimage-image-optimizer/hmcacjgnblkbpdfkedpebhilgdlbdkjo?hl=zh-CN&authuser=0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 hover:text-black transition-colors font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7Z" fill="white"/>
                <circle cx="12" cy="12" r="3" fill="#4285F4"/>
                <path d="M12 2L7 7H17L12 2Z" fill="#EA4335"/>
                <path d="M2 12L7 17L12 12L7 7L2 12Z" fill="#FBBC04"/>
                <path d="M22 12L17 7L12 12L17 17L22 12Z" fill="#34A853"/>
              </svg>
              Chrome Extension
            </a>
            <Link href="/">
              <Button className="rounded-xl font-bold gap-2">
                <Zap className="w-4 h-4" />
                Try Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Back Button */}
      {showBackButton && (
        <div className="max-w-7xl mx-auto px-6 py-4 w-full">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © 2026 Shopimage. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/pricing">
                <a className="text-sm text-slate-500 hover:text-black transition-colors">Pricing</a>
              </Link>
              <Link href="/faq">
                <a className="text-sm text-slate-500 hover:text-black transition-colors">FAQ</a>
              </Link>
              <Link href="/privacy">
                <a className="text-sm text-slate-500 hover:text-black transition-colors">Privacy Policy</a>
              </Link>
              <Link href="/terms">
                <a className="text-sm text-slate-500 hover:text-black transition-colors">Terms of Service</a>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
