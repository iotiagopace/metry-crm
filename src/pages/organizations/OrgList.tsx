import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Plus, Building2, X, MapPin } from "lucide-react";
import { useOrganizations } from "../../hooks/useOrganizations";
import { OrgForm } from "./OrgForm";

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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Clientes</h1>
          <p className="text-neutral-500 text-sm">
            {loading ? "Carregando..." : `${filtered.length.toLocaleString("pt-BR")} empresa${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Novo cliente
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cidade, segmento ou CNPJ..."
          className="w-full pl-9 pr-8 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
          <Building2 size={36} />
          <p className="text-sm font-medium">
            {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Adicionar primeiro cliente
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">
                  Segmento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">
                  Localização
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden xl:table-cell">
                  CNPJ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/organizations/${o.id}`}
                      className="font-semibold text-neutral-900 hover:text-blue-600 transition-colors"
                    >
                      {o.name}
                    </Link>
                    {o.segment && (
                      <p className="text-xs text-neutral-400 mt-0.5 md:hidden">{o.segment}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {o.segment ? (
                      <span className="bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {o.segment}
                      </span>
                    ) : (
                      <span className="text-neutral-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {o.city ? (
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin size={11} />
                        {[o.city, o.state].filter(Boolean).join(", ")}
                      </span>
                    ) : (
                      <span className="text-neutral-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-neutral-500 font-mono">
                    {o.cnpj || "—"}
                  </td>
                </tr>
              ))}
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
