import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DashboardModeProvider } from "@/contexts/DashboardModeContext";
import { LicenseGateProvider } from "@/contexts/LicenseContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PersonalPageGuard } from "@/components/layout/PersonalPageGuard";
import { LicenseGuard } from "@/components/license/LicenseGuard";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AnimatePresence } from "framer-motion";

// Lazy load pages for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const Setup = lazy(() => import("./pages/Setup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Notes = lazy(() => import("./pages/Notes"));
const Habits = lazy(() => import("./pages/Habits"));
const Family = lazy(() => import("./pages/Family"));
const Budget = lazy(() => import("./pages/Budget"));
const Salary = lazy(() => import("./pages/Salary"));
const Investments = lazy(() => import("./pages/Investments"));
const Loans = lazy(() => import("./pages/Loans"));
const Goals = lazy(() => import("./pages/Goals"));
const Projects = lazy(() => import("./pages/Projects"));
const Calendar = lazy(() => import("./pages/Calendar"));
const SupportUsers = lazy(() => import("./pages/SupportUsers"));
const DeviceInventory = lazy(() => import("./pages/DeviceInventory"));
const DeviceProfile = lazy(() => import("./pages/DeviceProfile"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const SubmitTicket = lazy(() => import("./pages/SubmitTicket"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback for lazy-loaded pages
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

// App content with onboarding
const AppContent = () => {
  const { showOnboarding, isLoading, completeOnboarding } = useOnboarding();

  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showOnboarding && (
          <OnboardingFlow onComplete={completeOnboarding} />
        )}
      </AnimatePresence>
      {!showOnboarding && (
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/setup" element={<Setup />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<LicenseGuard><AppLayout><Dashboard /></AppLayout></LicenseGuard>} />
            <Route path="/tasks" element={<LicenseGuard><AppLayout><Tasks /></AppLayout></LicenseGuard>} />
            <Route path="/notes" element={<LicenseGuard><AppLayout><Notes /></AppLayout></LicenseGuard>} />
            <Route path="/habits" element={<LicenseGuard><AppLayout><PersonalPageGuard><Habits /></PersonalPageGuard></AppLayout></LicenseGuard>} />
            <Route path="/family" element={<LicenseGuard><AppLayout><PersonalPageGuard><Family /></PersonalPageGuard></AppLayout></LicenseGuard>} />
            <Route path="/budget" element={<LicenseGuard><AppLayout><PersonalPageGuard><Budget /></PersonalPageGuard></AppLayout></LicenseGuard>} />
            <Route path="/salary" element={<LicenseGuard><AppLayout><PersonalPageGuard><Salary /></PersonalPageGuard></AppLayout></LicenseGuard>} />
            <Route path="/investments" element={<LicenseGuard><AppLayout><PersonalPageGuard><Investments /></PersonalPageGuard></AppLayout></LicenseGuard>} />
            <Route path="/loans" element={<LicenseGuard><AppLayout><PersonalPageGuard><Loans /></PersonalPageGuard></AppLayout></LicenseGuard>} />
            <Route path="/goals" element={<LicenseGuard><AppLayout><Goals /></AppLayout></LicenseGuard>} />
            <Route path="/projects" element={<LicenseGuard><AppLayout><Projects /></AppLayout></LicenseGuard>} />
            <Route path="/calendar" element={<LicenseGuard><AppLayout><Calendar /></AppLayout></LicenseGuard>} />
            <Route path="/support-users" element={<LicenseGuard><AppLayout><SupportUsers /></AppLayout></LicenseGuard>} />
            <Route path="/device-inventory" element={<LicenseGuard><AppLayout><DeviceInventory /></AppLayout></LicenseGuard>} />
            <Route path="/device/:deviceNumber" element={<LicenseGuard><DeviceProfile /></LicenseGuard>} />
            <Route path="/support-tickets" element={<LicenseGuard><AppLayout><SupportTickets /></AppLayout></LicenseGuard>} />
            <Route path="/submit-ticket" element={<LicenseGuard><SubmitTicket /></LicenseGuard>} />
            <Route path="/settings" element={<LicenseGuard><AppLayout><Settings /></AppLayout></LicenseGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      )}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <DashboardModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <PWAInstallPrompt />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </DashboardModeProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
