import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Pricing from "@/pages/pricing";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/landing" component={Landing} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
