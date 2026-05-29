import { useState, useMemo } from "react";
import {
  Plus, CheckCircle2, Circle, AlertCircle, Loader2, Trash2,
  LayoutGrid, List, Filter, Search, X, Calendar,
  Users, FileText,
  Zap, Target,
} from "lucide-react";
import { useTasks } from "../../hooks/useTasks";
import { Modal } from "../../components/Modal";
import { post } from "../../lib/api";

// ─── Commercial flow templates ────────────────────────────────────────────────
const FLOW_TEMPLATES = [
  {
    category: "Prospecção",
    color: "#64748b",
    icon: Target,
    tasks: [
      { title: "Pesquisar empresa no LinkedIn e site", days: 0 },
      { title: "Montar lista de decisores",            days: 0 },
      { title: "Primeiro contato via WhatsApp/ligação",days: 1 },
    ],
  },
  {
    category: "Qualificação",
    color: "#f97316",
    icon: Filter,
    tasks: [
      { title: "Ligação de diagnóstico (SPIN Selling)", days: 2 },
      { title: "Identificar orçamento e prazo",         days: 3 },
      { title: "Mapear concorrentes que o cliente usa", days: 3 },
    ],
  },
  {
    category: "Proposta",
    color: "#8b5cf6",
    icon: FileText,
    tasks: [
      { title: "Montar proposta personalizada",          days: 5 },
      { title: "Enviar proposta por e-mail",             days: 5 },
      { title: "Follow-up 48h após envio da proposta",   days: 7 },
    ],
  },
  {
    category: "Negociação",
    color: "#eab308",
    icon: Users,
    tasks: [
      { title: "Reunião de alinhamento / objeções",     days: 10 },
      { title: "Ajustar proposta conforme feedback",    days: 11 },
      { title: "Enviar contrato para assinatura",       days: 12 },
    ],
  },
  {
    category: "Pós-venda",
    color: "#10b981",
    icon: CheckCircle2,
    tasks: [
      { title: "Onboarding: reunião de kickoff",        days: 15 },
      { title: "Solicitar indicação / NPS",             days: 30 },
      { title: "Revisão 30 dias: entrega vs expectativa",days: 30 },
    ],
  },
];


type ViewMode = "list" | "kanban" | "calendar";

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanColumn({
  title, color, tasks, onComplete, onRemove,
}: {
  title: string; color: string;
  tasks: { id: string; title: string; due_date: string; completed: boolean; crm_organizations?: { name: string } | null }[];
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="w-64 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2.5 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#737686]">{title}</span>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white ml-auto" style={{ backgroundColor: color }}>
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2 min-h-[80px]">
        {tasks.map((t) => {
          const overdue = !t.completed && t.due_date < today;
          return (
            <div key={t.id} className={`bg-white rounded-xl border p-3 group ${overdue ? "border-red-200" : "border-[#e5e5e5]"} hover:shadow-sm transition-all`}>
              <div className="flex items-start gap-2">
                <button onClick={() => onComplete(t.id)} disabled={t.completed} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
                  {t.completed ? <CheckCircle2 size={16} className="text-green-500" /> : overdue ? <AlertCircle size={16} className="text-red-400" /> : <Circle size={16} className="text-neutral-300 hover:text-[#2563eb]" />}
                </button>
                <p className={`text-sm leading-tight flex-1 ${t.completed ? "line-through text-neutral-400" : "text-[#1a1c1c]"}`}>{t.title}</p>
                <button onClick={() => onRemove(t.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Calendar size={11} className={overdue ? "text-red-400" : "text-neutral-400"} />
                <span className={`text-[11px] ${overdue ? "text-red-500 font-semibold" : "text-neutral-400"}`}>
                  {new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
                {t.crm_organizations && (
                  <span className="text-[11px] text-neutral-400 truncate ml-auto max-w-[80px]">· {t.crm_organizations.name}</span>
                )}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="rounded-xl border-2 border-dashed flex items-center justify-center h-20 text-[11px] text-neutral-400" style={{ borderColor: color + "40" }}>
            Nenhuma tarefa
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main TaskList ─────────────────────────────────────────────────────────────
export function TaskList() {
  const { tasks, loading, complete, remove, reload } = useTasks();
  const [showNew, setShowNew] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState({ title: "", due_date: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "overdue" | "today" | "week">("all");

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  const filtered = useMemo(() => {
    let list = tab === "pending" ? pending : done;
    if (search) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filter === "overdue") list = list.filter((t) => !t.completed && t.due_date < today);
    if (filter === "today")   list = list.filter((t) => t.due_date === today);
    if (filter === "week")    list = list.filter((t) => t.due_date <= weekEnd && t.due_date >= today);
    return list;
  }, [tasks, tab, search, filter, today, weekEnd, pending, done]);

  // Kanban columns based on commercial flow
  const kanbanCols = [
    { title: "Prospecção", color: "#64748b",  filter: (t: typeof tasks[0]) => !t.completed && t.due_date >= today },
    { title: "Vencidas",   color: "#ef4444",  filter: (t: typeof tasks[0]) => !t.completed && t.due_date < today },
    { title: "Hoje",       color: "#f97316",  filter: (t: typeof tasks[0]) => !t.completed && t.due_date === today },
    { title: "Semana",     color: "#2563eb",  filter: (t: typeof tasks[0]) => !t.completed && t.due_date > today && t.due_date <= weekEnd },
    { title: "Concluídas", color: "#10b981",  filter: (t: typeof tasks[0]) => t.completed },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await post("/tasks", { title: form.title, due_date: form.due_date });
      await reload();
      setShowNew(false);
      setForm({ title: "", due_date: "", priority: "medium" });
    } finally { setSaving(false); }
  };

  const addFromTemplate = async (title: string, days: number) => {
    const due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    await post("/tasks", { title, due_date: due });
    await reload();
  };

  const overdue = pending.filter((t) => t.due_date < today);
  const dueToday = pending.filter((t) => t.due_date === today);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-[#f9f9f9] border-b border-[#e5e5e5] px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-bold text-[#1a1c1c]">Tarefas</h1>
          <p className="text-xs text-[#737686]">
            {pending.length} pendente{pending.length !== 1 ? "s" : ""}
            {overdue.length > 0 && <span className="text-red-500 font-semibold"> · {overdue.length} vencida{overdue.length > 1 ? "s" : ""}</span>}
            {dueToday.length > 0 && <span className="text-orange-500 font-semibold"> · {dueToday.length} para hoje</span>}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarefa..."
              className="pl-8 pr-3 py-2 bg-[#eeeeee] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] outline-none w-40 md:w-52" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737686]"><X size={12} /></button>}
          </div>

          {/* Filter */}
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 border border-[#e5e5e5] bg-white rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] outline-none text-[#434655]">
            <option value="all">Todas</option>
            <option value="overdue">Vencidas</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
          </select>

          {/* View toggle */}
          <div className="flex bg-[#eeeeee] rounded-lg p-0.5">
            {([["list", List], ["kanban", LayoutGrid]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                className={`p-1.5 rounded-md transition-colors ${view === v ? "bg-white shadow-sm text-[#1a1c1c]" : "text-[#737686]"}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>

          {/* Template button */}
          <button onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e5e5] bg-white rounded-lg text-sm text-[#434655] hover:border-[#2563eb] transition-colors">
            <Zap size={13} />
            Fluxo Comercial
          </button>

          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus size={14} />
            Nova tarefa
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Pendentes", value: pending.length, color: "#2563eb", bg: "#dbeafe" },
            { label: "Vencidas",  value: overdue.length, color: "#ef4444", bg: "#fee2e2" },
            { label: "Para Hoje", value: dueToday.length, color: "#f97316", bg: "#ffedd5" },
            { label: "Concluídas", value: done.length,   color: "#10b981", bg: "#dcfce7" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-[#e5e5e5] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-[#737686] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs (list mode only) */}
        {view === "list" && (
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 mb-4 w-fit">
            {(["pending", "done"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white shadow text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}>
                {t === "pending" ? `Pendentes (${pending.length})` : `Concluídas (${done.length})`}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === "kanban" ? (
          /* ── KANBAN VIEW ── */
          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-max pb-6">
              {kanbanCols.map((col) => (
                <KanbanColumn key={col.title} title={col.title} color={col.color}
                  tasks={tasks.filter(col.filter)}
                  onComplete={complete}
                  onRemove={remove} />
              ))}
            </div>
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-neutral-400">
                {tab === "pending" ? (
                  <>
                    <CheckCircle2 size={36} className="mx-auto mb-3 text-green-300" />
                    <p className="text-sm font-medium">Nenhuma tarefa pendente 🎉</p>
                    <p className="text-xs mt-1">Tudo em dia!</p>
                  </>
                ) : (
                  <p className="text-sm">Nenhuma tarefa concluída ainda</p>
                )}
              </div>
            )}
            {filtered.map((t) => {
              const overdue = !t.completed && t.due_date < today;
              const isToday = !t.completed && t.due_date === today;
              return (
                <div key={t.id} className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors group ${overdue ? "border-red-200 bg-red-50" : isToday ? "border-orange-200 bg-orange-50" : "border-[#e5e5e5] bg-white"}`}>
                  <button onClick={() => !t.completed && complete(t.id)} disabled={t.completed}
                    className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                    {t.completed ? <CheckCircle2 size={20} className="text-green-500" /> :
                     overdue     ? <AlertCircle size={20} className="text-red-400" /> :
                                   <Circle size={20} className="text-neutral-300 hover:text-[#2563eb] transition-colors" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${t.completed ? "line-through text-neutral-400" : "text-[#1a1c1c]"}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-semibold ${overdue ? "text-red-600" : isToday ? "text-orange-600" : "text-neutral-400"}`}>
                        {overdue && "⚠ Venceu em "}
                        {isToday && "Hoje · "}
                        {new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                      {t.crm_organizations && <span className="text-xs text-neutral-400 truncate">· {t.crm_organizations.name}</span>}
                      {t.crm_opportunities  && <span className="text-xs text-neutral-400 truncate">· {t.crm_opportunities.title}</span>}
                    </div>
                  </div>
                  <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-300 hover:text-red-400 transition-all rounded-lg shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New task modal */}
      {showNew && (
        <Modal title="Nova tarefa" onClose={() => setShowNew(false)}>
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">Título *</label>
              <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Ligar para cliente amanhã" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">Data limite *</label>
                <input required type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">Prioridade</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="flex-1 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {saving && <Loader2 size={16} className="animate-spin" />} Criar tarefa
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Commercial flow templates modal */}
      {showTemplates && (
        <Modal title="Fluxo Comercial — Tarefas Padrão" onClose={() => setShowTemplates(false)} width="max-w-2xl">
          <div className="p-5 space-y-4">
            <p className="text-sm text-[#737686]">
              Adicione rapidamente tarefas de um fluxo comercial completo para agências digitais.
              As datas são calculadas automaticamente a partir de hoje.
            </p>
            {FLOW_TEMPLATES.map((tmpl) => (
              <div key={tmpl.category} className="bg-[#f9f9f9] rounded-xl border border-[#e5e5e5] overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#e5e5e5]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tmpl.color }} />
                  <span className="text-sm font-semibold text-[#1a1c1c]">{tmpl.category}</span>
                </div>
                <div className="divide-y divide-[#f0f0f0]">
                  {tmpl.tasks.map((task) => (
                    <div key={task.title} className="flex items-center justify-between px-4 py-2.5 hover:bg-white transition-colors">
                      <p className="text-sm text-[#434655] flex-1 mr-4">{task.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#737686]">+{task.days}d</span>
                        <button onClick={() => addFromTemplate(task.title, task.days)}
                          className="px-3 py-1 bg-[#2563eb] text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1">
                          <Plus size={12} /> Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setShowTemplates(false)} className="w-full py-2.5 border border-[#e5e5e5] rounded-xl text-sm font-medium text-[#434655] hover:bg-[#f5f5f5]">
              Fechar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
