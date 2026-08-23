import { Route, Routes } from "react-router-dom";
import { Header } from "@/components/Header";
import HomePage from "@/pages/HomePage";
import CampaignDetailPage from "@/pages/CampaignDetailPage";
import CreateCampaignPage from "@/pages/CreateCampaignPage";
import DashboardPage from "@/pages/DashboardPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/campaign/:address" element={<CampaignDetailPage />} />
          <Route path="/create" element={<CreateCampaignPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        CrowdChain — fully on-chain crowdfunding. Contracts are law.
      </footer>
    </div>
  );
}
