import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AppLayout } from "./components/AppLayout";

import Index from "./pages/Index";
import { SchedulePage } from "./pages/SchedulePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { ProfilePage } from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
export default AppRouter;