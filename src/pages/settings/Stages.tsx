import { useState, useEffect } from "react";
import {
  Plus, Trash2, Loader2, Database, Target,
  SlidersHorizontal, Puzzle, Tag, XCircle, Mail,
  Check, AlertTriangle, Zap, Globe, Slack, MessageSquare,
  BarChart2, Users, UserPlus, ShieldCheck,
} from "lucide-react";
import { get, post, del } from "../../lib/api";
import type { Stage } from "../../hooks/useOpportunities";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GoalTemplate {
  id: string;
  label: string;
  metric: string;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  target: number;
  unit: string;
}

interface LossReason {
  id: string;
  label: string;
  count?: number;
}

type SettingsTab =
  | "stages"
  | "goals"
  | "loss_reasons"
  | "preferences"
  | "team"
  | "integrations"
  | "segments"
  | "email_templates";

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_GOALS: GoalTemplate[] = [
  { id: "1", label: "Receita Mensal",          metric: "revenue",      period: "monthly",   target: 50000,  unit: "R$"      },
  { id: "2", label: "Novos Leads",             metric: "new_leads",    period: "monthly",   target: 30,     unit: "leads"   },
  { id: "3", label: "Oportunidades Fechadas",  metric: "won_deals",    period: "monthly",   target: 10,     unit: "negócios"},
  { id: "4", label: "Taxa de Conversão",       metric: "conv_rate",    period: "quarterly", target: 25,     unit: "%"       },
  { id: "5", label: "Ticket Médio",            metric: "avg_ticket",   period: "monthly",   target: 5000,   unit: "R$"      },
  { id: "6", label: "Atividades por Dia",      metric: "activities",   period: "daily",     target: 15,     unit: "atividades"},
];

const DEFAULT_LOSS_REASONS: LossReason[] = [
  { id: "lr1", label: "Preço acima do orçamento",       count: 0 },
  { id: "lr2", label: "Escolheu concorrente",           count: 0 },
  { id: "lr3", label: "Projeto cancelado internamente", count: 0 },
  { id: "lr4", label: "Sem orçamento no momento",       count: 0 },
  { id: "lr5", label: "Produto não atende necessidade", count: 0 },
  { id: "lr6", label: "Falta de urgência / timing",     count: 0 },
  { id: "lr7", label: "Contato perdido / sem resposta", count: 0 },
];

const INTEGRATIONS = [
  { icon: Mail,         name: "Gmail / Google Workspace", desc: "Sincronize e-mails e calendário",        status: "available", color: "#ea4335" },
  { icon: Slack,        name: "Slack",                    desc: "Notificações em tempo real no canal",    status: "available", color: "#4a154b" },
  { icon: MessageSquare,name: "WhatsApp Business",        desc: "Envio e recepção de mensagens",          status: "available", color: "#25d366" },
  { icon: Globe,        name: "RD Station",               desc: "Importe leads do seu funil de marketing",status: "available", color: "#2563eb" },
  { icon: Zap,          name: "Zapier",                   desc: "Conecte mais de 5.000 aplicativos",      status: "available", color: "#ff4a00" },
  { icon: BarChart2,    name: "Google Analytics",         desc: "Rastreie conversões de leads",           status: "available", color: "#e37400" },
];

const PERIOD_LABELS: Record<string, string> = {
  daily: "Diário", weekly: "Semanal", monthly: "Mensal",
  quarterly: "Trimestral", annual: "Anual",
};

// ─── Sub-panels ───────────────────────────────────────────────────────────────
function PanelStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setStages(await get<Stage[]>("/settings/stages")); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      await post("/settings/stages", { label: newLabel.trim(), color: newColor, position: stages.length });
      setNewLabel(""); setNewColor("#6b7280");
      await load();
    } finally { setSaving(false); }
  };

  const deleteStage = async (id: string, label: string) => {
    if (!confirm(`Excluir a etapa "${label}"?`)) return;
    await del(`/settings/stages/${id}`);
    await load();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
        <h2 className="font-semibold text-[#1a1c1c] text-sm">Etapas do Pipeline</h2>
        <p className="text-xs text-[#737686] mt-0.5">Personalize as colunas do seu funil de vendas</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-[#f5f5f5]">
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f9f9f9] transition-colors">
              <span className="text-xs text-[#d4d4d4] font-mono w-4">{i + 1}</span>
              <div className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-sm font-medium text-[#1a1c1c]">{s.label}</span>
              {s.is_won  && <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-semibold">Ganho</span>}
              {s.is_lost && <span className="text-xs bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-semibold">Perdido</span>}
              {!s.is_won && !s.is_lost && (
                <button onClick={() => deleteStage(s.id, s.label)} className="p-1.5 text-[#d4d4d4] hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addStage} className="flex items-center gap-2.5 px-5 py-4 border-t border-[#e5e5e5] bg-[#f9f9f9]">
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
          className="w-9 h-9 border border-[#e5e5e5] rounded-lg cursor-pointer bg-white p-0.5" />
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Nome da nova etapa..."
          className="flex-1 px-3 py-2 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white" />
        <button type="submit" disabled={saving || !newLabel.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors shrink-0">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Adicionar
        </button>
      </form>
    </div>
  );
}

function PanelGoals() {
  const [goals, setGoals] = useState<GoalTemplate[]>(DEFAULT_GOALS);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<number>(0);

  const saveGoal = (id: string) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, target: editVal } : g));
    setEditing(null);
  };

  const fmt = (g: GoalTemplate) =>
    g.unit === "R$"
      ? `R$ ${g.target.toLocaleString("pt-BR")}`
      : `${g.target.toLocaleString("pt-BR")} ${g.unit}`;

  return (
    <div className="space-y-4">
      {/* Market benchmark callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <BarChart2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Benchmarks de Mercado — Agências Digitais</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Taxa de conversão média: <strong>15–25%</strong> · Ticket médio: <strong>R$ 3.000–8.000</strong> ·
            Ciclo de venda: <strong>14–45 dias</strong> · Follow-ups necessários: <strong>5–8 contatos</strong>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
          <h2 className="font-semibold text-[#1a1c1c] text-sm">Metas Comerciais</h2>
          <p className="text-xs text-[#737686] mt-0.5">Defina metas padrão de mercado para acompanhar performance</p>
        </div>
        <div className="divide-y divide-[#f5f5f5]">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f9f9f9] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1c1c]">{g.label}</p>
                <p className="text-xs text-[#737686]">{PERIOD_LABELS[g.period]}</p>
              </div>
              {editing === g.id ? (
                <div className="flex items-center gap-2">
                  <input type="number" value={editVal} onChange={(e) => setEditVal(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 border border-[#2563eb] rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] outline-none text-right" />
                  <button onClick={() => saveGoal(g.id)} className="p-1.5 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5]">
                    <XCircle size={14} className="text-[#737686]" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setEditing(g.id); setEditVal(g.target); }}
                  className="text-sm font-bold text-[#2563eb] hover:underline px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                  {fmt(g)}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelLossReasons() {
  const [reasons, setReasons] = useState<LossReason[]>(DEFAULT_LOSS_REASONS);
  const [newLabel, setNewLabel] = useState("");

  const addReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setReasons((prev) => [...prev, { id: `lr${Date.now()}`, label: newLabel.trim(), count: 0 }]);
    setNewLabel("");
  };

  const removeReason = (id: string) => setReasons((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
        <h2 className="font-semibold text-[#1a1c1c] text-sm">Motivos de Perda</h2>
        <p className="text-xs text-[#737686] mt-0.5">
          Pré-carregado com os principais motivos de perda no mercado de agências. Customize conforme necessário.
        </p>
      </div>

      <div className="divide-y divide-[#f5f5f5]">
        {reasons.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f9f9f9] group transition-colors">
            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="flex-1 text-sm text-[#1a1c1c]">{r.label}</span>
            {typeof r.count === "number" && r.count > 0 && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">{r.count}x usado</span>
            )}
            <button onClick={() => removeReason(r.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[#d4d4d4] hover:text-red-400 transition-all rounded-lg">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addReason} className="flex items-center gap-2.5 px-5 py-4 border-t border-[#e5e5e5] bg-[#f9f9f9]">
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Adicionar motivo de perda..."
          className="flex-1 px-3 py-2 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white" />
        <button type="submit" disabled={!newLabel.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors">
          <Plus size={15} /> Adicionar
        </button>
      </form>
    </div>
  );
}

function PanelPreferences() {
  const [prefs, setPrefs] = useState({
    currency: "BRL",
    locale: "pt-BR",
    fiscal_year_start: "01",
    default_pipeline_view: "kanban",
    activity_reminder_days: 3,
    lead_idle_alert_days: 7,
    require_loss_reason: true,
    auto_close_won_tasks: true,
    show_value_in_pipeline: true,
    email_notifications: true,
  });

  const toggle = (k: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [k]: !p[k as keyof typeof prefs] }));

  const ToggleRow = ({ label, desc, k }: { label: string; desc: string; k: keyof typeof prefs }) => (
    <div className="flex items-center justify-between py-4 border-b border-[#f5f5f5] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#1a1c1c]">{label}</p>
        <p className="text-xs text-[#737686] mt-0.5">{desc}</p>
      </div>
      <button onClick={() => toggle(k)} className={`relative w-11 h-6 rounded-full transition-colors ${prefs[k] ? "bg-[#2563eb]" : "bg-[#d4d4d4]"}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[k] ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
      <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Preferências Gerais</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">Moeda</label>
          <select value={prefs.currency} onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}
            className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#2563eb] outline-none">
            <option value="BRL">R$ — Real Brasileiro</option>
            <option value="USD">$ — Dólar Americano</option>
            <option value="EUR">€ — Euro</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">Visão padrão do Pipeline</label>
          <select value={prefs.default_pipeline_view} onChange={(e) => setPrefs((p) => ({ ...p, default_pipeline_view: e.target.value }))}
            className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#2563eb] outline-none">
            <option value="kanban">Kanban (colunas)</option>
            <option value="list">Lista</option>
            <option value="table">Tabela</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">Alerta de lead parado (dias)</label>
          <input type="number" min="1" max="60" value={prefs.lead_idle_alert_days}
            onChange={(e) => setPrefs((p) => ({ ...p, lead_idle_alert_days: Number(e.target.value) }))}
            className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#737686] uppercase tracking-wide mb-1.5 block">Lembrete de atividade (dias)</label>
          <input type="number" min="1" max="30" value={prefs.activity_reminder_days}
            onChange={(e) => setPrefs((p) => ({ ...p, activity_reminder_days: Number(e.target.value) }))}
            className="w-full px-3 py-2.5 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none" />
        </div>
      </div>

      <ToggleRow label="Exigir motivo de perda" desc="Obrigatório ao mover negócio para 'Perdido'" k="require_loss_reason" />
      <ToggleRow label="Concluir tarefas ao ganhar negócio" desc="Marca todas as tarefas pendentes como concluídas" k="auto_close_won_tasks" />
      <ToggleRow label="Mostrar valor nas colunas do pipeline" desc="Exibe total monetário no cabeçalho de cada etapa" k="show_value_in_pipeline" />
      <ToggleRow label="Notificações por e-mail" desc="Receba alertas de tarefas vencidas e leads ociosos" k="email_notifications" />

      <button className="mt-5 w-full py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
        Salvar Preferências
      </button>
    </div>
  );
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "seller";
  active: boolean;
}

function PanelTeam() {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const stored = localStorage.getItem("crm_team_members");
    if (stored) return JSON.parse(stored) as TeamMember[];
    const currentUser = JSON.parse(localStorage.getItem("crm_user") || "null") as { id?: string; name?: string; email?: string } | null;
    return currentUser
      ? [{ id: currentUser.id ?? "admin", name: currentUser.name ?? "Administrador", email: currentUser.email ?? "", role: "admin", active: true }]
      : [];
  });
  const [form, setForm] = useState({ name: "", email: "", role: "seller" as TeamMember["role"] });

  useEffect(() => {
    localStorage.setItem("crm_team_members", JSON.stringify(members));
  }, [members]);

  const addMember = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setMembers((prev) => [
      ...prev,
      { id: `member-${Date.now()}`, name: form.name.trim(), email: form.email.trim(), role: form.role, active: true },
    ]);
    setForm({ name: "", email: "", role: "seller" });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Admin visualiza tudo. Vendedores devem receber leads e oportunidades atribuídas a eles pelo campo responsável.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
          <h2 className="font-semibold text-[#1a1c1c] text-sm">Equipe Comercial</h2>
          <p className="text-xs text-[#737686] mt-0.5">Adicione vendedores e defina permissões iniciais</p>
        </div>

        <div className="divide-y divide-[#f5f5f5]">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {member.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1c1c] truncate">{member.name}</p>
                <p className="text-xs text-[#737686] truncate">{member.email}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${member.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-neutral-100 text-neutral-600"}`}>
                {member.role === "admin" ? "Admin" : "Vendedor"}
              </span>
              <button
                onClick={() => setMembers((prev) => prev.map((item) => item.id === member.id ? { ...item, active: !item.active } : item))}
                className={`relative w-11 h-6 rounded-full transition-colors ${member.active ? "bg-[#2563eb]" : "bg-[#d4d4d4]"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${member.active ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addMember} className="grid md:grid-cols-[1fr_1fr_140px_auto] gap-2 px-5 py-4 border-t border-[#e5e5e5] bg-[#f9f9f9]">
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nome do vendedor"
            className="px-3 py-2 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white" />
          <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="email@empresa.com"
            className="px-3 py-2 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white" />
          <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as TeamMember["role"] }))}
            className="px-3 py-2 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white">
            <option value="seller">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
          <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <UserPlus size={15} /> Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}

function PanelIntegrations() {
  const [connected, setConnected] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          As integrações abaixo expandem as capacidades do CRM. Conecte ferramentas que sua equipe já usa para centralizar o processo comercial.
        </p>
      </div>

      {INTEGRATIONS.map((intg) => {
        const isConnected = connected.has(intg.name);
        return (
          <div key={intg.name} className="bg-white rounded-2xl border border-[#e5e5e5] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: intg.color + "18" }}>
              <intg.icon size={20} style={{ color: intg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1c1c]">{intg.name}</p>
              <p className="text-xs text-[#737686]">{intg.desc}</p>
            </div>
            <button
              onClick={() => setConnected((prev) => { const s = new Set(prev); isConnected ? s.delete(intg.name) : s.add(intg.name); return s; })}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isConnected
                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-[#2563eb] text-white hover:bg-blue-700"
              }`}
            >
              {isConnected ? "✓ Conectado" : "Conectar"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function PanelSegments() {
  const DEFAULT_SEGS = [
    "Indústria e Comércio", "Saúde e Odontologia", "Tecnologia e Software",
    "Serviços e Varejo", "Alimentação", "Educação", "Religioso e Social",
    "Comunicação e Mídia", "Construção e Imóveis", "Jurídico e Contábil", "Outros",
  ];
  const [segs, setSegs] = useState(DEFAULT_SEGS);
  const [newSeg, setNewSeg] = useState("");

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
        <h2 className="font-semibold text-[#1a1c1c] text-sm">Segmentos de Clientes</h2>
        <p className="text-xs text-[#737686] mt-0.5">Categorias usadas para classificar empresas no CRM</p>
      </div>
      <div className="p-5 flex flex-wrap gap-2">
        {segs.map((s) => (
          <div key={s} className="flex items-center gap-1.5 bg-[#f5f5f5] rounded-full px-3 py-1.5 text-sm text-[#434655] group">
            <span>{s}</span>
            <button onClick={() => setSegs((p) => p.filter((x) => x !== s))} className="opacity-0 group-hover:opacity-100 text-[#737686] hover:text-red-500 transition-all">
              <XCircle size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-5 pb-5">
        <input value={newSeg} onChange={(e) => setNewSeg(e.target.value)} placeholder="Novo segmento..."
          className="flex-1 px-3 py-2 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none" />
        <button onClick={() => { if (newSeg.trim()) { setSegs((p) => [...p, newSeg.trim()]); setNewSeg(""); } }}
          className="px-4 py-2 bg-[#2563eb] text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
const MENU: { id: SettingsTab; label: string; Icon: React.ElementType; desc: string; group: string }[] = [
  { id: "stages",         label: "Etapas do Pipeline",  Icon: SlidersHorizontal, desc: "Gerencie as etapas do funil",           group: "Pipeline" },
  { id: "goals",          label: "Metas",               Icon: Target,            desc: "Padrões de meta de mercado",             group: "Pipeline" },
  { id: "loss_reasons",   label: "Motivos de Perda",    Icon: XCircle,           desc: "Por que negócios são perdidos",          group: "Pipeline" },
  { id: "segments",       label: "Segmentos",           Icon: Tag,               desc: "Categorias de clientes",                 group: "Cadastro" },
  { id: "team",           label: "Equipe",              Icon: Users,             desc: "Usuários, vendedores e permissões",       group: "Sistema" },
  { id: "preferences",    label: "Preferências",        Icon: Database,          desc: "Configurações gerais do CRM",            group: "Sistema" },
  { id: "integrations",   label: "Integrações",         Icon: Puzzle,            desc: "Conecte ferramentas externas",           group: "Sistema" },
  { id: "email_templates",label: "Modelos de E-mail",   Icon: Mail,              desc: "Templates para comunicação",             group: "Comunicação" },
];

export function SettingsStages() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("stages");
  const active = MENU.find((m) => m.id === activeTab)!;
  const groups = [...new Set(MENU.map((m) => m.group))];

  const renderPanel = () => {
    switch (activeTab) {
      case "stages":         return <PanelStages />;
      case "goals":          return <PanelGoals />;
      case "loss_reasons":   return <PanelLossReasons />;
      case "preferences":    return <PanelPreferences />;
      case "integrations":   return <PanelIntegrations />;
      case "segments":       return <PanelSegments />;
      case "team":           return <PanelTeam />;
      case "email_templates":
        return (
          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-8 text-center text-[#737686]">
            <Mail size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">Modelos de E-mail</p>
            <p className="text-xs mt-1">Em breve — configuração de templates para follow-up automático</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1a1c1c]">Configurações</h1>
        <p className="text-[#737686] text-sm mt-0.5">Personalize o CRM para o fluxo comercial da sua agência</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-2 px-1">{group}</p>
              <div className="space-y-0.5">
                {MENU.filter((m) => m.group === group).map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                      activeTab === id
                        ? "bg-[#2563eb] text-white font-semibold"
                        : "text-[#434655] hover:bg-[#f5f5f5]"
                    }`}>
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <active.Icon size={16} className="text-[#2563eb]" />
            <h2 className="font-bold text-[#1a1c1c]">{active.label}</h2>
            <span className="text-xs text-[#737686]">— {active.desc}</span>
          </div>
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
