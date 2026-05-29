import { useMemo } from "react";
import { Link } from "react-router";
import {
  TrendingUp, Users, Target, Kanban,
  Phone, Mail, MessageCircle, CheckSquare, StickyNote,
  ArrowRight, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useOpportunities } from "../hooks/useOpportunities";
import { useOrganizations } from "../hooks/useOrganizations";
import { useTasks } from "../hooks/useTasks";

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

const AVATAR_COLORS = [
  "#2563eb", "#7e22ce", "#15803d", "#b45309", "#0891b2", "#be185d",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SALES_TREND = [
  { month: "Jan", real: 42000, prev: 38000 },
  { month: "Fev", real: 58000, prev: 45000 },
  { month: "Mar", real: 51000, prev: 52000 },
  { month: "Abr", real: 74000, prev: 60000 },
  { month: "Mai", real: 68000, prev: 65000 },
  { month: "Jun", real: 89000, prev: 70000 },
  { month: "Jul", real: 95000, prev: 78000 },
  { month: "Ago", real: 82000, prev: 85000 },
  { month: "Set", real: 110000, prev: 92000 },
  { month: "Out", real: 98000, prev: 100000 },
  { month: "Nov", real: 124000, prev: 108000 },
  { month: "Dez", real: 135000, prev: 120000 },
];

const ACTIVITIES = [
  { icon: Phone, color: "#2563eb", bg: "#dbeafe", text: "Ligação com Rafael Lima", sub: "Proposta discutida — follow-up amanhã", time: "5 min atrás" },
  { icon: Mail, color: "#7e22ce", bg: "#f3e8ff", text: "E-mail enviado para TechCorp", sub: "Proposta comercial anexada", time: "32 min atrás" },
  { icon: Users, color: "#15803d", bg: "#dcfce7", text: "Reunião com Construtora Alfa", sub: "Apresentação do produto realizada", time: "2h atrás" },
  { icon: CheckSquare, color: "#b45309", bg: "#fef3c7", text: "Tarefa concluída", sub: "Enviar contrato para Grupo Beta", time: "4h atrás" },
  { icon: StickyNote, color: "#737686", bg: "#f5f5f5", text: "Nota adicionada", sub: "Cliente solicitou desconto de 10%", time: "1d atrás" },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: "Novo",        color: "#2563eb", bg: "#dbeafe" },
  contacted:   { label: "Contatado",   color: "#7e22ce", bg: "#f3e8ff" },
  qualified:   { label: "Qualificado", color: "#15803d", bg: "#dcfce7" },
  proposal:    { label: "Proposta",    color: "#b45309", bg: "#fef3c7" },
  negotiation: { label: "Negociação",  color: "#0891b2", bg: "#e0f2fe" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "#737686", bg: "#f5f5f5" };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

function TempStars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= n ? "#f59e0b" : "none"} stroke={i <= n ? "#f59e0b" : "#d1d5db"} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { orgs, loading: lo } = useOrganizations();
  const { opps, stages, loading: lp } = useOpportunities();
  const { tasks } = useTasks();

  const pipelineValue = useMemo(
    () => opps.reduce((s, o) => s + (o.value || 0), 0),
    [opps]
  );

  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => !t.completed && t.due_date < today);

  const byStage = useMemo(
    () =>
      Object.fromEntries(
        stages.map((s) => [s.id, opps.filter((o) => o.stage_id === s.id)])
      ),
    [stages, opps]
  );

  const topOpps = useMemo(
    () => [...opps].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5),
    [opps]
  );

  const kpis = [
    {
      label: "RECEITA TOTAL",
      value: lp ? "—" : fmt(pipelineValue),
      color: "#15803d",
      Icon: TrendingUp,
      change: "+12%",
      positive: true,
    },
    {
      label: "NOVOS LEADS",
      value: lo ? "—" : orgs.length.toLocaleString("pt-BR"),
      color: "#2563eb",
      Icon: Users,
      change: "+8%",
      positive: true,
    },
    {
      label: "TAXA DE CONVERSÃO",
      value: opps.length && orgs.length ? `${Math.round((opps.length / Math.max(orgs.length, 1)) * 100)}%` : "—",
      color: "#1a1c1c",
      Icon: Target,
      change: "-2%",
      positive: false,
    },
    {
      label: "OPORTUNIDADES ABERTAS",
      value: lp ? "—" : opps.length.toLocaleString("pt-BR"),
      color: "#7e22ce",
      Icon: Kanban,
      change: "+5%",
      positive: true,
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a1c1c]">Visão Geral de Vendas</h1>
          <p className="text-[#434655] text-sm mt-0.5">Acompanhe seu desempenho em tempo real</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((f) => (
            <button
              key={f}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                f === "30d"
                  ? "bg-[#2563eb] text-white"
                  : "bg-white border border-[#e5e5e5] text-[#434655] hover:border-[#2563eb]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Coluna principal */}
        <div>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {kpis.map(({ label, value, color, Icon, change, positive }) => (
              <div key={label} className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686]">{label}</p>
                  <div className="p-1.5 bg-[#f5f5f5] rounded-lg">
                    <Icon size={14} style={{ color }} />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-2" style={{ color }}>{value}</p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                    positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  {change} vs. mês anterior
                </span>
              </div>
            ))}
          </div>

          {/* Gráfico tendência de vendas */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#1a1c1c] text-sm">Tendência de Vendas</h2>
                <p className="text-xs text-[#737686] mt-0.5">Vendas reais vs. previsão — últimos 12 meses</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#737686]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#2563eb] rounded inline-block" />
                  Vendas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#93c5fd] rounded inline-block" />
                  Previsão
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={SALES_TREND} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
                <Area type="monotone" dataKey="real" stroke="#2563eb" strokeWidth={2} fill="url(#gradReal)" name="Vendas Reais" />
                <Area type="monotone" dataKey="prev" stroke="#93c5fd" strokeWidth={2} fill="url(#gradPrev)" name="Previsão" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Leads mais quentes */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
              <h2 className="font-semibold text-[#1a1c1c] text-sm">Leads Mais Quentes</h2>
              <Link to="/pipeline" className="text-xs text-[#2563eb] hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={11} />
              </Link>
            </div>
            {lp ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : topOpps.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#737686] text-sm">Nenhuma oportunidade cadastrada</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f9f9f9]">
                    {["CLIENTE", "EMPRESA", "STATUS", "TEMP.", "VALOR EST.", "AÇÕES"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5]">
                  {topOpps.map((opp) => {
                    const orgName = opp.crm_organizations?.name ?? "—";
                    const color = avatarColor(orgName);
                    return (
                      <tr key={opp.id} className="hover:bg-[#f9f9f9] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {initials(opp.title)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a1c1c] text-xs">{opp.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#434655]">{orgName}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status="qualified" />
                        </td>
                        <td className="px-4 py-3">
                          <TempStars n={opp.qualification ?? 3} />
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-[#15803d]">
                          {opp.value ? fmt(opp.value) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {[Mail, Phone, MessageCircle].map((Icon, i) => (
                              <button
                                key={i}
                                className="p-1.5 rounded-lg hover:bg-[#eeeeee] text-[#737686] transition-colors"
                              >
                                <Icon size={13} />
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Atividades recentes */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Atividades Recentes</h2>
            <div className="space-y-3">
              {ACTIVITIES.map(({ icon: Icon, color, bg, text, sub, time }, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1a1c1c] leading-snug truncate">{text}</p>
                    <p className="text-xs text-[#737686] truncate">{sub}</p>
                  </div>
                  <span className="text-[10px] text-[#737686] shrink-0 mt-0.5">{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline por etapa */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1a1c1c] text-sm">Pipeline por Etapa</h2>
              <Link to="/pipeline" className="text-xs text-[#2563eb] hover:underline flex items-center gap-1">
                Kanban <ArrowRight size={11} />
              </Link>
            </div>
            {lp ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {stages.map((s) => {
                  const list = byStage[s.id] ?? [];
                  const pct = opps.length ? (list.length / opps.length) * 100 : 0;
                  const val = list.reduce((a, o) => a + (o.value || 0), 0);
                  return (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#434655] font-medium">{s.label}</span>
                        <span className="text-xs text-[#737686]">{list.length} · {val > 0 ? fmt(val) : "—"}</span>
                      </div>
                      <div className="h-1.5 bg-[#f5f5f5] rounded-full">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: s.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tarefas vencidas */}
          {overdue.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">
                {overdue.length} tarefa{overdue.length > 1 ? "s" : ""} vencida{overdue.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5">
                {overdue.slice(0, 3).map((t) => (
                  <p key={t.id} className="text-xs text-red-600 truncate">{t.title}</p>
                ))}
              </div>
              <Link to="/tasks" className="text-xs text-red-600 font-semibold hover:underline mt-2 block">
                Ver todas →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
