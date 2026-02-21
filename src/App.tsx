import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import PortalNavbar from "@/components/PortalNavbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PortalNavbar />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/products" element={<Products />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/licenses" element={<ProtectedRoute adminOnly><AdminLicenses /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTickets /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/backup" element={<ProtectedRoute adminOnly><AdminBackup /></ProtectedRoute>} />
              <Route path="/admin/license-endpoint" element={<ProtectedRoute adminOnly><AdminLicenseEndpoint /></ProtectedRoute>} />
              <Route path="/admin/reconciliation" element={<ProtectedRoute adminOnly><AdminReconciliation /></ProtectedRoute>} />
              <Route path="/admin/website-settings" element={<ProtectedRoute adminOnly><AdminWebsiteSettings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
