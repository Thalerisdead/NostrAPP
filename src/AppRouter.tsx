import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { SchedulePage } from "./pages/SchedulePage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/schedule" element={<SchedulePage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;