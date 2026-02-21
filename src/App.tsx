import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import PortalNavbar from "@/components/PortalNavbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedRoute } from "@/components/AnimatedRoute";
import { AnimatePresence } from "framer-motion";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Cart = lazy(() => import("./pages/Cart"));
const Payment = lazy(() => import("./pages/Payment"));
const Profile = lazy(() => import("./pages/Profile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Support = lazy(() => import("./pages/Support"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLicenses = lazy(() => import("./pages/admin/AdminLicenses"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminBackup = lazy(() => import("./pages/admin/AdminBackup"));
const AdminLicenseEndpoint = lazy(() => import("./pages/admin/AdminLicenseEndpoint"));
const AdminReconciliation = lazy(() => import("./pages/admin/AdminReconciliation"));
const AdminWebsiteSettings = lazy(() => import("./pages/admin/AdminWebsiteSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="space-y-4 w-full max-w-md p-8">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const A = ({ children }: { children: React.ReactNode }) => <AnimatedRoute>{children}</AnimatedRoute>;

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<A><Index /></A>} />
          <Route path="/login" element={<A><Login /></A>} />
          <Route path="/register" element={<A><Register /></A>} />
          <Route path="/admin-login" element={<A><AdminLogin /></A>} />
          <Route path="/dashboard" element={<ProtectedRoute><A><Dashboard /></A></ProtectedRoute>} />
          <Route path="/products" element={<A><Products /></A>} />
          <Route path="/cart" element={<A><Cart /></A>} />
          <Route path="/payment" element={<ProtectedRoute><A><Payment /></A></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><A><Profile /></A></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><A><ChangePassword /></A></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><A><Support /></A></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><A><AdminDashboard /></A></ProtectedRoute>} />
          <Route path="/admin/licenses" element={<ProtectedRoute adminOnly><A><AdminLicenses /></A></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute adminOnly><A><AdminProducts /></A></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><A><AdminUsers /></A></ProtectedRoute>} />
          <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><A><AdminTickets /></A></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute adminOnly><A><AdminOrders /></A></ProtectedRoute>} />
          <Route path="/admin/backup" element={<ProtectedRoute adminOnly><A><AdminBackup /></A></ProtectedRoute>} />
          <Route path="/admin/license-endpoint" element={<ProtectedRoute adminOnly><A><AdminLicenseEndpoint /></A></ProtectedRoute>} />
          <Route path="/admin/reconciliation" element={<ProtectedRoute adminOnly><A><AdminReconciliation /></A></ProtectedRoute>} />
          <Route path="/admin/website-settings" element={<ProtectedRoute adminOnly><A><AdminWebsiteSettings /></A></ProtectedRoute>} />
          <Route path="*" element={<A><NotFound /></A>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PortalNavbar />
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
