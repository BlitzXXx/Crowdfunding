import { Route, Routes } from "react-router-dom";
import { Header } from "@/components/Header";
import HomePage from "@/pages/HomePage";
import CampaignDetailPage from "@/pages/CampaignDetailPage";
import CreateCampaignPage from "@/pages/CreateCampaignPage";
import DashboardPage from "@/pages/DashboardPage";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-bold text-slate-700">404</p>
      <p className="mt-4 text-lg text-slate-400">Page not found</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
        Back to campaigns
      </Link>
    </div>
  );
}

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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        CrowdChain — fully on-chain crowdfunding. Contracts are law.
      </footer>
    </div>
  );
}
