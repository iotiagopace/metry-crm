import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Kanban, Users, Building2, CheckSquare,
  BarChart2, Settings, HelpCircle, Bell, MessageCircle,
  HelpCircle as HelpCircleIcon, Plus, Menu, X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/dashboard",     label: "Dashboard",   Icon: LayoutDashboard },
  { to: "/pipeline",      label: "Pipeline",    Icon: Kanban },
  { to: "/organizations", label: "Contatos",    Icon: Users },
  { to: "/organizations", label: "Empresas",    Icon: Building2, skip: true },
  { to: "/tasks",         label: "Tarefas",     Icon: CheckSquare },
  { to: "/reports",       label: "Relatórios",  Icon: BarChart2 },
];

const NAV_UNIQUE = [
  { to: "/dashboard",     label: "Dashboard",   Icon: LayoutDashboard },
  { to: "/pipeline",      label: "Pipeline",    Icon: Kanban },
  { to: "/organizations", label: "Contatos",    Icon: Users },
  { to: "/tasks",         label: "Tarefas",     Icon: CheckSquare },
  { to: "/reports",       label: "Relatórios",  Icon: BarChart2 },
];

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <Spinner />;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userName = user?.name ?? user?.email ?? "Usuário";

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 bg-[#2f3131] shrink-0 flex-col fixed left-0 top-0 h-screen z-50">
        {/* Logo area */}
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="bg-[#2563eb] rounded-xl p-2.5 shrink-0">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Metry CRM</p>
            <p className="text-[#c9c6c5] opacity-70 text-xs">Sales Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {NAV_UNIQUE.map(({ to, label, Icon }) => {
            const active = pathname.startsWith(to) && !(to === "/organizations" && pathname === "/organizations" && label === "Empresas");
            return (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-4 px-4 py-2.5 text-sm rounded-r-lg transition-all ${
                  active
                    ? "nav-active"
                    : "text-[#c9c6c5] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-4 pb-5 space-y-3">
          <button
            onClick={() => navigate("/pipeline")}
            className="bg-[#2563eb] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 w-full hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            Novo Negócio
          </button>
          <div className="flex flex-col gap-0.5">
            <Link
              to="/settings"
              className={`flex items-center gap-4 px-4 py-2.5 text-sm rounded-r-lg transition-all ${
                pathname.startsWith("/settings")
                  ? "nav-active"
                  : "text-[#c9c6c5] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings size={16} />
              Configurações
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-2.5 text-sm text-[#c9c6c5] hover:bg-white/10 hover:text-white rounded-r-lg transition-all w-full text-left"
            >
              <HelpCircleIcon size={16} />
              Suporte / Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <div className="bg-[#f9f9f9] border-b border-[#c3c6d7] h-16 fixed top-0 right-0 left-0 md:left-60 z-40 flex items-center justify-between px-4 md:px-6">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[#eeeeee] text-[#434655] transition-colors mr-2"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            placeholder="Buscar..."
            className="bg-[#eeeeee] border-0 rounded-lg h-10 pl-9 pr-4 w-48 md:w-72 text-sm focus:ring-2 focus:ring-[#2563eb] outline-none"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <button className="p-2 rounded-lg hover:bg-[#eeeeee] text-[#434655] transition-colors" aria-label="Notificações">
            <Bell size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#eeeeee] text-[#434655] transition-colors hidden sm:flex" aria-label="Mensagens">
            <MessageCircle size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#eeeeee] text-[#434655] transition-colors hidden sm:flex" aria-label="Ajuda">
            <HelpCircle size={18} />
          </button>
          <div className="flex items-center gap-2 ml-1 pl-2 md:pl-3 border-l border-[#c3c6d7]">
            <div className="w-8 h-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(userName)}
            </div>
            <span className="text-sm font-medium text-[#1a1c1c] hidden md:inline truncate max-w-[120px]">
              {userName}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-60 bg-[#2f3131] flex flex-col pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pb-4 flex items-center gap-3">
              <div className="bg-[#2563eb] rounded-xl p-2.5">
                <LayoutDashboard size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Metry CRM</p>
                <p className="text-[#c9c6c5] opacity-70 text-xs">Sales Intelligence</p>
              </div>
            </div>
            <nav className="flex-1 px-2 space-y-0.5">
              {NAV.filter((n) => !n.skip).map(({ to, label, Icon }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-4 px-4 py-2.5 text-sm rounded-r-lg transition-all ${
                    pathname.startsWith(to)
                      ? "nav-active"
                      : "text-[#c9c6c5] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-5">
              <button
                onClick={handleLogout}
                className="text-[#c9c6c5] hover:text-white text-sm px-4 py-2.5 w-full text-left"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
