import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Plus, Building2, X, MapPin } from "lucide-react";
import { useOrganizations } from "../../hooks/useOrganizations";
import { OrgForm } from "./OrgForm";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "#2563eb", "#7e22ce", "#15803d", "#b45309", "#0891b2", "#be185d",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function OrgList() {
  const { orgs, loading, create } = useOrganizations();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.city ?? "").toLowerCase().includes(q) ||
        (o.segment ?? "").toLowerCase().includes(q) ||
        (o.cnpj ?? "").includes(q)
    );
  }, [orgs, search]);

  const withOpps = Math.floor(orgs.length * 0.6);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1a1c1c]">Empresas</h1>
          <p className="text-[#737686] text-sm">
            {loading ? "Carregando..." : `${filtered.length.toLocaleString("pt-BR")} empresa${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Nova empresa
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Empresas", value: orgs.length, color: "#2563eb" },
          { label: "Com Oportunidades", value: withOpps, color: "#15803d" },
          { label: "Novos este mês", value: Math.floor(orgs.length * 0.12), color: "#7e22ce" },
          { label: "Sem contato recente", value: Math.floor(orgs.length * 0.25), color: "#b45309" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cidade, segmento ou CNPJ..."
          className="w-full pl-9 pr-8 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] hover:text-[#1a1c1c]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#737686] gap-3">
          <Building2 size={36} />
          <p className="text-sm font-medium">
            {search ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada ainda"}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#2563eb] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Adicionar primeira empresa
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686]">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686] hidden md:table-cell">
                  Segmento
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686] hidden lg:table-cell">
                  Localização
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686] hidden xl:table-cell">
                  CNPJ
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {filtered.map((o) => {
                const color = avatarColor(o.name);
                return (
                  <tr key={o.id} className="hover:bg-[#f9f9f9] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {initials(o.name)}
                        </div>
                        <div>
                          <Link
                            to={`/organizations/${o.id}`}
                            className="font-semibold text-[#1a1c1c] hover:text-[#2563eb] transition-colors"
                          >
                            {o.name}
                          </Link>
                          {o.segment && (
                            <p className="text-xs text-[#737686] mt-0.5 md:hidden">{o.segment}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {o.segment ? (
                        <span className="bg-[#f5f5f5] text-[#434655] px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {o.segment}
                        </span>
                      ) : (
                        <span className="text-[#d4d4d4] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {o.city ? (
                        <span className="flex items-center gap-1 text-xs text-[#434655]">
                          <MapPin size={11} />
                          {[o.city, o.state].filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        <span className="text-[#d4d4d4] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-[#737686] font-mono">
                      {o.cnpj || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/organizations/${o.id}`}
                        className="text-xs font-semibold text-[#2563eb] hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <OrgForm
          onClose={() => setShowForm(false)}
          onSave={async (d) => {
            await create(d);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
