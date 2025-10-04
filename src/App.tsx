import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

const Home = lazy(() => import("./pages/Home"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Consulta = lazy(() => import("./pages/Consulta"));
const Mapa = lazy(() => import("./pages/Mapa"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Manual = lazy(() => import("./pages/Manual"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminConfirm = lazy(() => import("./pages/AdminConfirm"));
const AdminResetPassword = lazy(() => import("./pages/AdminResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
    <div className="text-center space-y-3">
      <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Carregando..</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/consulta" element={<Consulta />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/manual" element={<Manual />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/confirm" element={<AdminConfirm />} />
            <Route path="/admin/reset" element={<AdminResetPassword />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
