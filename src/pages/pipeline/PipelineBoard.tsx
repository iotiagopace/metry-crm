import { useState, useMemo } from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
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
      className="bg-white rounded-xl border border-neutral-200 p-3.5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
    >
      <p className="font-semibold text-neutral-900 text-sm leading-tight">{opp.title}</p>
      {opp.crm_organizations && (
        <p className="text-xs text-neutral-400 mt-0.5 truncate">{opp.crm_organizations.name}</p>
      )}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-neutral-100">
        <div onClick={(e) => e.stopPropagation()}>
          <Stars value={opp.qualification} onChange={onQualChange} size={13} />
        </div>
        {opp.value > 0 && (
          <span className="text-xs font-bold text-green-700">{fmt(opp.value)}</span>
        )}
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
      <div className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative min-w-44 flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar oportunidade..."
            className="w-full pl-8 pr-8 py-2 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-neutral-50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {totalValue > 0 && (
          <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl hidden sm:inline">
            Pipeline: {fmt(totalValue)}
          </span>
        )}

        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors ml-auto"
        >
          <Plus size={15} />
          Nova oportunidade
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                  <div
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border mb-2"
                    style={{ backgroundColor: s.color + "15", borderColor: s.color + "35" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-sm font-bold" style={{ color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: s.color }}
                      >
                        {list.length}
                      </span>
                      {total > 0 && (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: s.color }}>
                          {fmt(total)}
                        </p>
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
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Título *
              </label>
              <input
                required
                value={newForm.title}
                onChange={setField("title")}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Website para Empresa XYZ"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Cliente
              </label>
              <select
                value={newForm.organization_id}
                onChange={setField("organization_id")}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newForm.value}
                  onChange={setField("value")}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                  Etapa
                </label>
                <select
                  value={newForm.stage_id}
                  onChange={setField("stage_id")}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Previsão de fechamento
              </label>
              <input
                type="date"
                value={newForm.expected_close}
                onChange={setField("expected_close")}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
