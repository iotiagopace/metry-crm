import { useState, useMemo } from "react";
import { Plus, Search, X, Loader2, Filter, LayoutGrid, List } from "lucide-react";
import { useOpportunities, type Opportunity, type Stage } from "../../hooks/useOpportunities";
import { useOrganizations } from "../../hooks/useOrganizations";
import { OpportunityModal } from "./OpportunityModal";
import { Stars } from "../../components/Stars";
import { Modal } from "../../components/Modal";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function TempBadge({ q }: { q: number }) {
  if (q >= 4) return <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-md mb-2 inline-block">Quente</span>;
  if (q === 3) return <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2 py-0.5 rounded-md mb-2 inline-block">Morno</span>;
  return null;
}

function KanbanCard({
  opp,
  onClick,
  onQualChange,
}: {
  opp: Opportunity;
  onClick: () => void;
  onQualChange: (n: number) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#e5e5e5] rounded-xl p-4 cursor-pointer hover:border-[#2563eb] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all"
    >
      <TempBadge q={opp.qualification ?? 0} />
      <p className="font-semibold text-[#1a1c1c] text-sm leading-tight mb-0.5">{opp.title}</p>
      {opp.crm_organizations && (
        <p className="text-xs text-[#434655]">{opp.crm_organizations.name}</p>
      )}
      <div onClick={(e) => e.stopPropagation()} className="mt-1">
        <Stars value={opp.qualification} onChange={onQualChange} size={12} />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f5f5f5]">
        <span className="text-sm font-bold text-[#15803d]">
          {opp.value > 0 ? fmt(opp.value) : "—"}
        </span>
        <div
          className="w-7 h-7 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-bold"
        >
          {initials(opp.crm_organizations?.name ?? opp.title)}
        </div>
      </div>
    </div>
  );
}

interface NewOppForm {
  title: string;
  organization_id: string;
  value: string;
  stage_id: string;
  expected_close: string;
}

export function PipelineBoard() {
  const { opps, stages, loading, create, update, reload } = useOpportunities();
  const { orgs } = useOrganizations();
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [viewMode] = useState<"kanban" | "list">("kanban");
  const [newForm, setNewForm] = useState<NewOppForm>({
    title: "",
    organization_id: "",
    value: "",
    stage_id: "",
    expected_close: "",
  });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return opps;
    return opps.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        (o.crm_organizations?.name ?? "").toLowerCase().includes(q)
    );
  }, [opps, search]);

  const byStage = useMemo(
    () =>
      Object.fromEntries(
        stages.map((s) => [s.id, filtered.filter((o) => o.stage_id === s.id)])
      ),
    [stages, filtered]
  );

  const totalValue = useMemo(
    () => opps.filter((o) => !stages.find((s) => s.id === o.stage_id)?.is_lost)
           .reduce((a, o) => a + (o.value || 0), 0),
    [opps, stages]
  );

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await create({
        title: newForm.title,
        organization_id: newForm.organization_id || undefined,
        value: parseFloat(newForm.value) || 0,
        stage_id: newForm.stage_id || stages[0]?.id,
        expected_close: newForm.expected_close || undefined,
      });
      setShowNew(false);
      setNewForm({ title: "", organization_id: "", value: "", stage_id: "", expected_close: "" });
    } finally {
      setSaving(false);
    }
  };

  const setField = (k: keyof NewOppForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setNewForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Topbar */}
      <div className="bg-[#f9f9f9] border-b border-[#e5e5e5] px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-bold text-[#1a1c1c]">Pipeline</h1>
          <p className="text-xs text-[#737686]">{opps.length} oportunidades · {fmt(totalValue)}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-8 py-2 bg-[#eeeeee] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] outline-none w-44 md:w-56"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737686]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex bg-[#eeeeee] rounded-lg p-0.5 gap-0.5">
            <button className={`p-1.5 rounded-md transition-colors ${viewMode === "kanban" ? "bg-white shadow-sm text-[#1a1c1c]" : "text-[#737686]"}`}>
              <LayoutGrid size={15} />
            </button>
            <button className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-[#1a1c1c]" : "text-[#737686]"}`}>
              <List size={15} />
            </button>
          </div>

          {/* Filtros */}
          <button className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e5e5] bg-white rounded-lg text-sm text-[#434655] hover:border-[#2563eb] transition-colors">
            <Filter size={13} />
            Filtros
          </button>

          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={14} />
            Nova oportunidade
          </button>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4 md:p-6">
          <div className="flex gap-3 min-w-max pb-6">
            {stages.map((s: Stage) => {
              const list = byStage[s.id] ?? [];
              const total = list.reduce((a, o) => a + (o.value || 0), 0);
              return (
                <div key={s.id} className="w-72 shrink-0 flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#737686]">
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: s.color }}
                      >
                        {list.length}
                      </span>
                      {total > 0 && (
                        <span className="text-xs font-semibold text-[#737686]">
                          {fmt(total)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-0.5">
                    {list.length === 0 ? (
                      <div
                        className="rounded-xl border-2 border-dashed flex items-center justify-center h-20 text-xs font-medium"
                        style={{ borderColor: s.color + "40", color: s.color + "80" }}
                      >
                        Nenhuma oportunidade
                      </div>
                    ) : (
                      list.map((o) => (
                        <KanbanCard
                          key={o.id}
                          opp={o}
                          onClick={() => setSelected(o)}
                          onQualChange={(q) => update(o.id, { qualification: q })}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New opportunity modal */}
      {showNew && (
        <Modal title="Nova oportunidade" onClose={() => setShowNew(false)}>
          <form onSubmit={submitNew} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">
                Título *
              </label>
              <input
                required
                value={newForm.title}
                onChange={setField("title")}
                className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none"
                placeholder="Ex: Website para Empresa XYZ"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">
                Cliente
              </label>
              <select
                value={newForm.organization_id}
                onChange={setField("organization_id")}
                className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white"
              >
                <option value="">Selecione um cliente...</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newForm.value}
                  onChange={setField("value")}
                  className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">
                  Etapa
                </label>
                <select
                  value={newForm.stage_id}
                  onChange={setField("stage_id")}
                  className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white"
                >
                  <option value="">Padrão</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">
                Previsão de fechamento
              </label>
              <input
                type="date"
                value={newForm.expected_close}
                onChange={setField("expected_close")}
                className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 border border-[#d4d4d4] rounded-xl text-sm font-medium text-[#434655] hover:bg-[#f5f5f5]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Criar oportunidade
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Opportunity detail modal */}
      {selected && (
        <OpportunityModal
          opp={selected}
          stages={stages}
          onClose={() => setSelected(null)}
          onChange={() => {
            reload();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
