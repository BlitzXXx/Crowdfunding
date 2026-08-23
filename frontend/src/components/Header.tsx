import { NavLink } from "react-router-dom";
import { Rocket } from "lucide-react";
import { ConnectButton } from "@/components/ConnectButton";

const NAV = [
  { to: "/", label: "Campaigns" },
  { to: "/create", label: "Create" },
  { to: "/dashboard", label: "Dashboard" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Rocket size={18} />
          </span>
          CrowdChain
        </NavLink>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <ConnectButton />
      </div>
    </header>
  );
}
