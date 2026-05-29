import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Kanban, CheckSquare,
  BarChart2, Settings, Bell, MessageCircle,
  HelpCircle, Plus, Menu, X, ChevronDown,
  LogOut, User, Building2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// ─── Nav structure with hierarchy ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    group: "Principal",
    items: [
      { to: "/dashboard", label: "Dashboard",   Icon: LayoutDashboard },
      { to: "/pipeline",  label: "Pipeline",    Icon: Kanban },
    ],
  },
  {
    group: "Cadastros",
    items: [
      { to: "/organizations", label: "Empresas",   Icon: Building2 },
      { to: "/tasks",         label: "Tarefas",    Icon: CheckSquare },
    ],
  },
  {
    group: "Análises",
    items: [
      { to: "/reports",       label: "Relatórios", Icon: BarChart2 },
    ],
  },
  {
    group: "Sistema",
    items: [
      { to: "/settings",      label: "Configurações", Icon: Settings },
    ],
  },
];

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function Layout() {
  const { user, logout, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (loading) return <Spinner />;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userName = user?.name ?? user?.email ?? "Usuário";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-[#e5e5e5]">
        <div className="bg-[#2563eb] rounded-xl p-2.5 shrink-0">
          <LayoutDashboard size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-[#1a1c1c] text-sm leading-tight">Metry CRM</p>
          <p className="text-[#737686] text-xs">Sales Intelligence</p>
        </div>
      </div>

      {/* New deal CTA */}
      <div className="px-4 py-3 border-b border-[#e5e5e5]">
        <button
          onClick={() => { navigate("/pipeline"); setMobileOpen(false); }}
          className="bg-[#2563eb] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 w-full hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Novo Negócio
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group} className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a0a0a0] px-3 mb-1.5">{group}</p>
            <div className="space-y-0.5">
              {items.map(({ to, label, Icon }) => {
                const active = pathname.startsWith(to);
                return (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${
                      active
                        ? "bg-[#2563eb] text-white font-semibold shadow-sm"
                        : "text-[#434655] hover:bg-[#f0f0f0] hover:text-[#1a1c1c]"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-white" : "text-[#737686]"} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-[#e5e5e5]">
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-[#f0f0f0] transition-colors"
        >
          <div className="w-8 h-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials(userName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-[#1a1c1c] truncate">{userName}</p>
            <p className="text-[11px] text-[#737686]">Consultor</p>
          </div>
          <ChevronDown size={14} className={`text-[#737686] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {userMenuOpen && (
          <div className="mt-1 bg-white border border-[#e5e5e5] rounded-xl shadow-lg overflow-hidden">
            <Link to="/settings" onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#434655] hover:bg-[#f5f5f5] transition-colors">
              <User size={14} className="text-[#737686]" />
              Meu Perfil
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
              <LogOut size={14} />
              Sair
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Sidebar desktop — LIGHT theme with black icons */}
      <aside className="hidden md:flex w-60 bg-white border-r border-[#e5e5e5] shrink-0 flex-col fixed left-0 top-0 h-screen z-50">
        <SidebarContent />
      </aside>

      {/* Topbar */}
      <div className="bg-white border-b border-[#e5e5e5] h-14 fixed top-0 right-0 left-0 md:left-60 z-40 flex items-center justify-between px-4 md:px-6">
        {/* Mobile menu */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[#f5f5f5] text-[#434655] transition-colors mr-2"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Buscar..."
            className="bg-[#f5f5f5] border-0 rounded-lg h-9 pl-9 pr-4 w-40 md:w-64 text-sm focus:ring-2 focus:ring-[#2563eb] outline-none"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#434655] transition-colors" aria-label="Notificações">
            <Bell size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#434655] transition-colors hidden sm:flex" aria-label="Mensagens">
            <MessageCircle size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#434655] transition-colors hidden sm:flex" aria-label="Ajuda">
            <HelpCircle size={18} />
          </button>
          <div className="flex items-center gap-2 ml-1 pl-2 md:pl-3 border-l border-[#e5e5e5]">
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
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-y-0 left-0 w-64 bg-white border-r border-[#e5e5e5] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
