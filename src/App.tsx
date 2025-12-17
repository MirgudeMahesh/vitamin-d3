import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CampDetails from "./pages/CampDetails";
import PatientManagement from "./pages/PatientManagement";
import Auth from "./pages/Auth"; // auto-login only
import HiddenLogin from "./pages/HiddenLogin"; // visible login UI
import Signout from "./pages/Signout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Root: main app entry, protected by Index */}
            <Route path="/" element={<Index />} />

            {/* Auto-login route used only via emailed link */}
            <Route path="/auth" element={<Auth />} />

            {/* Secret/hidden manual login page */}
            <Route path="/hidden-login" element={<HiddenLogin />} />

            {/* Other app pages – they assume user is logged in via Index guarding */}
            <Route path="/camp/:campId" element={<Index />} />
            <Route path="/camp/:campId/patients" element={<Index />} />

            <Route path="/want-to-signout" element={<Signout />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
