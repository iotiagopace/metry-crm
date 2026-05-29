import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  Building2, Kanban, CheckSquare, LayoutDashboard,
  Settings, LogOut, Menu, X, TrendingUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/dashboard",     label: "Dashboard",     Icon: LayoutDashboard },
  { to: "/organizations", label: "Clientes",      Icon: Building2 },
  { to: "/pipeline",      label: "Pipeline",      Icon: Kanban },
  { to: "/tasks",         label: "Tarefas",       Icon: CheckSquare },
  { to: "/settings",      label: "Configurações", Icon: Settings },
];

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return <Spinner />;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  function NavLinks({ onClick }: { onClick?: () => void }) {
    return (
      <>
        {NAV.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith(to)
                ? "bg-blue-600 text-white"
                : "text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </>
    );
  }

  function SidebarContent({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp size={17} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white">Metry CRM</p>
            <p className="text-xs text-neutral-400 truncate">{user?.name ?? user?.email}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavLinks onClick={onNav} />
        </nav>
        <div className="px-3 pb-5 pt-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-all"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-neutral-950 shrink-0 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 bg-neutral-950 flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
            <TrendingUp size={15} />
          </div>
          <span className="text-white font-bold text-sm">Metry CRM</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-64 bg-neutral-950 pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onNav={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 md:pt-0 pt-14 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
