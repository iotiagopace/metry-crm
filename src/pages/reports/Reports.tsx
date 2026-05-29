import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { useOpportunities } from "../../hooks/useOpportunities";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

const FUNNEL_DATA = [
  { stage: "Prospecção",       count: 205, value: 4200000, pct: 100 },
  { stage: "Qualificação",     count: 780, value: 2800000, pct: 85 },
  { stage: "Proposta Enviada", count: 312, value: 1500000, pct: 60 },
  { stage: "Negociação",       count: 78,  value: 840000,  pct: 25 },
];

const SOURCE_DATA = [
  { name: "Tráfego Pago",      value: 45, color: "#2563eb" },
  { name: "LinkedIn Outreach", value: 25, color: "#7e22ce" },
  { name: "Indicações",        value: 15, color: "#15803d" },
  { name: "Outros",            value: 15, color: "#737686" },
];

const MONTHLY_REVENUE = [
  { month: "Jan", receita: 42000 },
  { month: "Fev", receita: 58000 },
  { month: "Mar", receita: 51000 },
  { month: "Abr", receita: 74000 },
  { month: "Mai", receita: 68000 },
  { month: "Jun", receita: 89000 },
];

const CONSULTORES = [
  { name: "Ana Souza",    deals: 14, value: 320000 },
  { name: "Bruno Lima",  deals: 11, value: 274000 },
  { name: "Carla Melo",  deals: 9,  value: 198000 },
  { name: "Diego Costa", deals: 7,  value: 156000 },
  { name: "Elena Park",  deals: 6,  value: 132000 },
];

export function Reports() {
  const { opps, stages } = useOpportunities();

  const totalValue = useMemo(
    () => opps.reduce((s, o) => s + (o.value || 0), 0),
    [opps]
  );

  const wonStage = stages.find((s) => s.is_won);
  const wonOpps = wonStage ? opps.filter((o) => o.stage_id === wonStage.id) : [];
  const convRate = opps.length ? Math.round((wonOpps.length / opps.length) * 100) : 0;

  const kpis = [
    { label: "RECEITA TOTAL", value: fmt(totalValue), color: "#15803d", Icon: DollarSign },
    { label: "OPORTUNIDADES",  value: opps.length.toString(), color: "#2563eb", Icon: Target },
    { label: "TAXA CONVERSÃO", value: `${convRate}%`, color: "#7e22ce", Icon: TrendingUp },
    { label: "LEADS ATIVOS",   value: (opps.length - wonOpps.length).toString(), color: "#b45309", Icon: Users },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1a1c1c]">Relatórios</h1>
        <p className="text-[#737686] text-sm mt-0.5">Análise de performance do pipeline de vendas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686]">{label}</p>
              <div className="p-1.5 bg-[#f5f5f5] rounded-lg">
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Receita Mensal */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Receita Mensal</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#737686" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
              <Bar dataKey="receita" fill="#2563eb" radius={[6, 6, 0, 0]} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Origem dos Leads */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Origem dos Leads</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={SOURCE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {SOURCE_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ fontSize: 12, color: "#434655" }}>{value}</span>}
              />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Funil de Conversão */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Funil de Conversão</h2>
          <div className="space-y-3">
            {FUNNEL_DATA.map(({ stage, count, value, pct }) => (
              <div key={stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#1a1c1c]">{stage}</span>
                  <div className="flex items-center gap-3 text-xs text-[#737686]">
                    <span>{count} leads</span>
                    <span className="font-semibold text-[#1a1c1c]">{fmt(value)}</span>
                  </div>
                </div>
                <div className="h-2 bg-[#f5f5f5] rounded-full">
                  <div
                    className="h-2 rounded-full bg-[#2563eb] transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking Consultores */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
          <h2 className="font-semibold text-[#1a1c1c] text-sm mb-4">Ranking de Consultores</h2>
          <div className="space-y-3">
            {CONSULTORES.map(({ name, deals, value }, i) => {
              const COLORS = ["#2563eb", "#7e22ce", "#15803d", "#b45309", "#737686"];
              const color = COLORS[i] ?? "#737686";
              return (
                <div key={name} className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1a1c1c]">{name}</span>
                      <span className="text-xs font-bold" style={{ color }}>{fmt(value)}</span>
                    </div>
                    <div className="h-1.5 bg-[#f5f5f5] rounded-full mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${(value / CONSULTORES[0].value) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[#737686] shrink-0">{deals} deals</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
