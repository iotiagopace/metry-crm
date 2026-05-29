import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Users, Target, DollarSign, Clock, Phone, Mail,
  MessageCircle, ArrowUp, ArrowDown,
  Zap, Filter,
} from "lucide-react";
import { useOpportunities } from "../../hooks/useOpportunities";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}

// ─── Static mock data ─────────────────────────────────────────────────────────
const MONTHLY_REVENUE = [
  { month: "Jan", receita: 42000, meta: 50000 },
  { month: "Fev", receita: 58000, meta: 50000 },
  { month: "Mar", receita: 51000, meta: 55000 },
  { month: "Abr", receita: 74000, meta: 55000 },
  { month: "Mai", receita: 68000, meta: 60000 },
  { month: "Jun", receita: 89000, meta: 60000 },
];

const SOURCE_DATA = [
  { name: "Tráfego Pago",      value: 45, color: "#2563eb" },
  { name: "LinkedIn Outreach", value: 25, color: "#7e22ce" },
  { name: "Indicações",        value: 15, color: "#15803d" },
  { name: "Outros",            value: 15, color: "#737686" },
];

const FUNNEL_DATA = [
  { stage: "Prospecção",       leads: 205, value: 4200000, pct: 100, conv: "100%" },
  { stage: "Qualificação",     leads: 128, value: 2800000, pct: 62,  conv: "62%" },
  { stage: "Proposta Enviada", leads: 54,  value: 1500000, pct: 26,  conv: "42%" },
  { stage: "Negociação",       leads: 21,  value: 840000,  pct: 10,  conv: "39%" },
  { stage: "Ganho",            leads: 11,  value: 420000,  pct: 5,   conv: "52%" },
];

const CONSULTORES = [
  { name: "Ana Souza",    deals: 14, value: 320000, activities: 87, avg_cycle: 18, conv: 32 },
  { name: "Bruno Lima",  deals: 11, value: 274000, activities: 72, avg_cycle: 22, conv: 28 },
  { name: "Carla Melo",  deals: 9,  value: 198000, activities: 61, avg_cycle: 25, conv: 24 },
  { name: "Diego Costa", deals: 7,  value: 156000, activities: 54, avg_cycle: 30, conv: 20 },
  { name: "Elena Park",  deals: 6,  value: 132000, activities: 48, avg_cycle: 28, conv: 18 },
];

const ATTEND_TIME = [
  { seg: "0–2 dias",   count: 12, color: "#10b981" },
  { seg: "3–7 dias",   count: 24, color: "#2563eb" },
  { seg: "8–15 dias",  count: 18, color: "#f97316" },
  { seg: "16–30 dias", count: 9,  color: "#eab308" },
  { seg: ">30 dias",   count: 5,  color: "#ef4444" },
];

const ACTIVITY_TREND = [
  { week: "S1", calls: 24, emails: 18, whatsapp: 32, meetings: 8 },
  { week: "S2", calls: 28, emails: 22, whatsapp: 38, meetings: 6 },
  { week: "S3", calls: 19, emails: 30, whatsapp: 41, meetings: 10 },
  { week: "S4", calls: 35, emails: 25, whatsapp: 29, meetings: 12 },
];

const COLORS_CONSULT = ["#2563eb", "#7e22ce", "#15803d", "#b45309", "#737686"];

type ReportTab = "performance" | "funnel" | "team" | "attendance" | "activities";

const TABS: { id: ReportTab; label: string; Icon: React.ElementType }[] = [
  { id: "performance", label: "Performance",        Icon: TrendingUp  },
  { id: "funnel",      label: "Funil de Conversão", Icon: Filter      },
  { id: "team",        label: "Equipe",             Icon: Users       },
  { id: "attendance",  label: "Tempo de Atendimento",Icon: Clock      },
  { id: "activities",  label: "Atividades",         Icon: Zap         },
];

// ─── Tab: Performance ──────────────────────────────────────────────────────────
function TabPerformance({ opps, stages }: { opps: any[]; stages: any[] }) {
  const totalValue = useMemo(() => opps.reduce((s, o) => s + (o.value || 0), 0), [opps]);
  const wonStage = stages.find((s: any) => s.is_won);
  const wonOpps = wonStage ? opps.filter((o) => o.stage_id === wonStage.id) : [];
  const convRate = opps.length ? Math.round((wonOpps.length / opps.length) * 100) : 0;

  const kpis = [
    { label: "RECEITA TOTAL",    value: fmt(totalValue),             color: "#15803d", Icon: DollarSign, change: "+14%",  positive: true  },
    { label: "OPORTUNIDADES",    value: opps.length.toString(),      color: "#2563eb", Icon: Target,     change: "+8%",   positive: true  },
    { label: "TAXA CONVERSÃO",   value: `${convRate}%`,              color: "#7e22ce", Icon: TrendingUp, change: "+3pp",  positive: true  },
    { label: "TICKET MÉDIO",     value: fmt(opps.length ? totalValue / opps.length : 0), color: "#b45309", Icon: DollarSign, change: "-2%", positive: false },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, Icon, change, positive }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686]">{label}</p>
              <div className="p-1.5 bg-[#f5f5f5] rounded-lg"><Icon size={14} style={{ color }} /></div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-2 ${positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {change} vs. mês anterior
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-[#1a1c1c] text-sm">Receita Real vs. Meta</h2>
            <p className="text-xs text-[#737686] mt-0.5">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#737686]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#2563eb] rounded inline-block" />Receita</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#d1d5db] rounded inline-block border-t-2 border-dashed" />Meta</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
            <Bar dataKey="receita" fill="#2563eb" radius={[6, 6, 0, 0]} name="Receita" />
            <Bar dataKey="meta"    fill="#e5e7eb" radius={[6, 6, 0, 0]} name="Meta" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Origem dos Leads</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={SOURCE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {SOURCE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#434655" }}>{v}</span>} />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Pipeline por Etapa</h2>
          <div className="space-y-3">
            {FUNNEL_DATA.map(({ stage, leads, value, pct }) => (
              <div key={stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#1a1c1c]">{stage}</span>
                  <div className="flex items-center gap-3 text-xs text-[#737686]">
                    <span>{leads} leads</span>
                    <span className="font-semibold text-[#1a1c1c]">{fmt(value)}</span>
                  </div>
                </div>
                <div className="h-2 bg-[#f5f5f5] rounded-full">
                  <div className="h-2 rounded-full bg-[#2563eb] transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Funnel ──────────────────────────────────────────────────────────────
function TabFunnel() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
        <h2 className="font-semibold text-[#1a1c1c] text-sm mb-1">Funil de Conversão Detalhado</h2>
        <p className="text-xs text-[#737686] mb-6">Taxa de conversão entre cada etapa do pipeline</p>
        <div className="space-y-4">
          {FUNNEL_DATA.map((row, i) => (
            <div key={row.stage} className="relative">
              <div className="flex items-center gap-4">
                <div className="w-28 text-right">
                  <p className="text-xs font-semibold text-[#1a1c1c]">{row.stage}</p>
                </div>
                <div className="flex-1 relative">
                  <div className="h-10 bg-[#f5f5f5] rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                      style={{ width: `${row.pct}%`, backgroundColor: "#2563eb" + (Math.round((row.pct / 100) * 0.9 * 255 + 0.1 * 255)).toString(16).padStart(2, "0") }}>
                      <span className="text-xs text-white font-semibold">{row.leads} leads</span>
                    </div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <p className="text-xs font-semibold text-[#15803d]">{fmt(row.value)}</p>
                  <p className="text-[11px] text-[#737686]">{row.conv} conv.</p>
                </div>
              </div>
              {i < FUNNEL_DATA.length - 1 && (
                <div className="flex items-center gap-4 my-1">
                  <div className="w-28" />
                  <div className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                    <ArrowDown size={11} />
                    Conversão: {FUNNEL_DATA[i + 1].conv}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
        <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Ciclo Médio de Venda por Etapa (dias)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { stage: "Prospeção→Quali.", days: 3.2 },
            { stage: "Quali.→Proposta",  days: 5.8 },
            { stage: "Proposta→Nego.",   days: 8.1 },
            { stage: "Nego.→Ganho",      days: 4.5 },
          ]} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#737686" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} unit="d" />
            <Tooltip formatter={(v: number) => `${v} dias`} contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
            <Bar dataKey="days" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Dias médios" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab: Team ─────────────────────────────────────────────────────────────────
function TabTeam() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Consultores", value: CONSULTORES.length, color: "#2563eb" },
          { label: "Média de Deals",    value: Math.round(CONSULTORES.reduce((s, c) => s + c.deals, 0) / CONSULTORES.length), color: "#7e22ce" },
          { label: "Receita/Consultor", value: fmt(CONSULTORES.reduce((s, c) => s + c.value, 0) / CONSULTORES.length), color: "#15803d" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
          <h2 className="font-semibold text-[#1a1c1c] text-sm">Ranking de Performance</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9f9f9] border-b border-[#f0f0f0]">
              {["#", "Consultor", "Deals", "Receita", "Atividades", "Ciclo Médio", "Conv."].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f5f5]">
            {CONSULTORES.map((c, i) => (
              <tr key={c.name} className="hover:bg-[#f9f9f9] transition-colors">
                <td className="px-4 py-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS_CONSULT[i] }}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS_CONSULT[i] }}>
                      {c.name.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <span className="font-semibold text-[#1a1c1c]">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1a1c1c]">{c.deals}</span>
                    <div className="w-16 h-1.5 bg-[#f5f5f5] rounded-full">
                      <div className="h-1.5 rounded-full" style={{ width: `${(c.deals / CONSULTORES[0].deals) * 100}%`, backgroundColor: COLORS_CONSULT[i] }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: COLORS_CONSULT[i] }}>{fmt(c.value)}</td>
                <td className="px-4 py-3 text-[#434655]">{c.activities}</td>
                <td className="px-4 py-3 text-[#434655]">{c.avg_cycle}d</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.conv >= 28 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-600"}`}>
                    {c.conv}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Attendance time ──────────────────────────────────────────────────────
function TabAttendance() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tempo Médio de Resposta", value: "4h 12min", sub: "Primeiro contato",  color: "#2563eb" },
          { label: "Ciclo Médio de Venda",    value: "23 dias",  sub: "Prospecção → Ganho",color: "#7e22ce" },
          { label: "Tempo até Proposta",      value: "8 dias",   sub: "Após qualificação",  color: "#f97316" },
          { label: "SLA de Follow-up",        value: "87%",      sub: "Dentro do prazo",    color: "#10b981" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-2">{label}</p>
            <p className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</p>
            <p className="text-xs text-[#737686]">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Distribuição do Tempo de Atendimento</h2>
          <div className="space-y-3">
            {ATTEND_TIME.map(({ seg, count, color }) => {
              const max = Math.max(...ATTEND_TIME.map((x) => x.count));
              return (
                <div key={seg}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#1a1c1c]">{seg}</span>
                    <span className="text-xs font-bold" style={{ color }}>{count} negócios</span>
                  </div>
                  <div className="h-2.5 bg-[#f5f5f5] rounded-full">
                    <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${(count / max) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#737686] mt-4 pt-3 border-t border-[#f5f5f5]">
            <strong>Meta de mercado:</strong> 80% dos negócios resolvidos em até 15 dias para agências digitais.
          </p>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Ciclo de Venda por Consultor (dias)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CONSULTORES.map((c) => ({ name: c.name.split(" ")[0], days: c.avg_cycle }))} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} unit="d" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#434655" }} axisLine={false} tickLine={false} />
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
              <Tooltip formatter={(v: number) => `${v} dias`} contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
              <Bar dataKey="days" fill="#2563eb" radius={[0, 6, 6, 0]} name="Ciclo médio" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Activities ───────────────────────────────────────────────────────────
function TabActivities() {
  const activityKpis = [
    { label: "Ligações / Semana",    value: "26",  icon: Phone,          color: "#2563eb" },
    { label: "E-mails / Semana",     value: "24",  icon: Mail,           color: "#7e22ce" },
    { label: "WhatsApp / Semana",    value: "35",  icon: MessageCircle,  color: "#10b981" },
    { label: "Reuniões / Semana",    value: "9",   icon: Users,          color: "#f97316" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activityKpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686]">{label}</p>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: color + "18" }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
        <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Volume de Atividades — Últimas 4 Semanas</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ACTIVITY_TREND} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
            <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#434655" }}>{v}</span>} />
            <Line type="monotone" dataKey="calls"     stroke="#2563eb" strokeWidth={2} dot={false} name="Ligações" />
            <Line type="monotone" dataKey="emails"    stroke="#7e22ce" strokeWidth={2} dot={false} name="E-mails" />
            <Line type="monotone" dataKey="whatsapp"  stroke="#10b981" strokeWidth={2} dot={false} name="WhatsApp" />
            <Line type="monotone" dataKey="meetings"  stroke="#f97316" strokeWidth={2} dot={false} name="Reuniões" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
        <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Atividades por Consultor</h2>
        <div className="space-y-3">
          {CONSULTORES.map((c, i) => {
            const max = Math.max(...CONSULTORES.map((x) => x.activities));
            return (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: COLORS_CONSULT[i] }}>
                  {c.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#1a1c1c]">{c.name}</span>
                    <span className="text-xs font-bold" style={{ color: COLORS_CONSULT[i] }}>{c.activities} atividades</span>
                  </div>
                  <div className="h-2 bg-[#f5f5f5] rounded-full">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${(c.activities / max) * 100}%`, backgroundColor: COLORS_CONSULT[i] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Reports Page ─────────────────────────────────────────────────────────
export function Reports() {
  const { opps, stages } = useOpportunities();
  const [activeTab, setActiveTab] = useState<ReportTab>("performance");
  const [period, setPeriod] = useState("30d");

  const renderTab = () => {
    switch (activeTab) {
      case "performance": return <TabPerformance opps={opps} stages={stages} />;
      case "funnel":      return <TabFunnel />;
      case "team":        return <TabTeam />;
      case "attendance":  return <TabAttendance />;
      case "activities":  return <TabActivities />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a1c1c]">Relatórios</h1>
          <p className="text-[#737686] text-sm mt-0.5">Análise completa de performance comercial</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1a"].map((f) => (
            <button key={f} onClick={() => setPeriod(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${f === period ? "bg-[#2563eb] text-white" : "bg-white border border-[#e5e5e5] text-[#434655] hover:border-[#2563eb]"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5f5f5] rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === id ? "bg-white shadow text-[#1a1c1c]" : "text-[#737686] hover:text-[#1a1c1c]"}`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}
