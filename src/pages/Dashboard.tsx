import { useMemo } from "react";
import { Link } from "react-router";
import { Building2, Kanban, CheckSquare, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { useOrganizations } from "../hooks/useOrganizations";
import { useOpportunities } from "../hooks/useOpportunities";
import { useTasks } from "../hooks/useTasks";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />;
}

export function Dashboard() {
  const { orgs, loading: lo } = useOrganizations();
  const { opps, stages, loading: lp } = useOpportunities();
  const { tasks, complete } = useTasks();

  const pipelineValue = useMemo(
    () => opps.reduce((s, o) => s + (o.value || 0), 0),
    [opps]
  );

  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => !t.completed && t.due_date < today);
  const todayTasks = tasks.filter((t) => !t.completed && t.due_date === today);

  const byStage = useMemo(
    () =>
      Object.fromEntries(
        stages.map((s) => [s.id, opps.filter((o) => o.stage_id === s.id)])
      ),
    [stages, opps]
  );

  const kpis = [
    {
      label: "Clientes",
      value: lo ? <Spinner /> : orgs.length.toLocaleString("pt-BR"),
      Icon: Building2,
      color: "blue",
      to: "/organizations",
    },
    {
      label: "Oportunidades",
      value: lp ? <Spinner /> : opps.length.toLocaleString("pt-BR"),
      Icon: Kanban,
      color: "purple",
      to: "/pipeline",
    },
    {
      label: "Valor no Pipeline",
      value: lp ? <Spinner /> : fmt(pipelineValue),
      Icon: TrendingUp,
      color: "green",
      to: "/pipeline",
    },
    {
      label: "Tarefas hoje",
      value: String(todayTasks.length),
      Icon: CheckSquare,
      color: overdue.length > 0 ? "red" : "orange",
      to: "/tasks",
    },
  ] as const;

  const colorClasses = {
    blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   val: "text-blue-700" },
    purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", val: "text-purple-700" },
    green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-600",  val: "text-green-700" },
    orange: { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-600", val: "text-orange-700" },
    red:    { bg: "bg-red-50",    icon: "bg-red-100 text-red-600",      val: "text-red-700" },
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Visão geral do seu CRM</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, Icon, color, to }) => {
          const c = colorClasses[color];
          return (
            <Link
              key={label}
              to={to}
              className={`${c.bg} rounded-2xl p-4 hover:shadow-md transition-shadow group`}
            >
              <div className={`w-9 h-9 ${c.icon} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <div className={`text-2xl font-bold ${c.val} min-h-[32px] flex items-center`}>
                {value}
              </div>
              <p className="text-xs text-neutral-600 font-medium mt-0.5 flex items-center gap-1">
                {label}
                <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </Link>
          );
        })}
      </div>

      {/* Pipeline por etapa */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-800">Pipeline por Etapa</h2>
          <Link
            to="/pipeline"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Ver kanban <ArrowRight size={12} />
          </Link>
        </div>
        {lp ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {stages.map((s) => {
              const list = byStage[s.id] ?? [];
              const val = list.reduce((a, o) => a + (o.value || 0), 0);
              const pct = opps.length ? (list.length / opps.length) * 100 : 0;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-neutral-700 w-28 shrink-0">{s.label}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 w-6 text-right font-medium">
                    {list.length}
                  </span>
                  {val > 0 && (
                    <span
                      className="text-xs font-bold w-28 text-right"
                      style={{ color: s.color }}
                    >
                      {fmt(val)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tarefas vencidas */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-red-500" />
            <h2 className="font-semibold text-red-700">
              {overdue.length} tarefa{overdue.length > 1 ? "s" : ""} vencida
              {overdue.length > 1 ? "s" : ""}
            </h2>
          </div>
          <div className="space-y-2">
            {overdue.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-red-800 flex-1 truncate">{t.title}</span>
                {t.crm_organizations && (
                  <span className="text-xs text-red-500 shrink-0 hidden sm:inline">
                    {t.crm_organizations.name}
                  </span>
                )}
                <span className="text-xs text-red-500 shrink-0 font-semibold">
                  {new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
                <button
                  onClick={() => complete(t.id)}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium"
                >
                  Concluir
                </button>
              </div>
            ))}
          </div>
          {overdue.length > 5 && (
            <Link to="/tasks" className="text-xs text-red-600 hover:underline mt-3 block">
              Ver todas as {overdue.length} tarefas →
            </Link>
          )}
        </div>
      )}

      {/* Empty state */}
      {!lo && !lp && orgs.length === 0 && opps.length === 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-blue-500" />
          </div>
          <h3 className="font-bold text-neutral-900 text-lg mb-1">Bem-vindo ao Metry CRM</h3>
          <p className="text-neutral-500 text-sm mb-6 max-w-xs mx-auto">
            Comece adicionando seus primeiros clientes e criando oportunidades no pipeline.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/organizations"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Adicionar cliente
            </Link>
            <Link
              to="/pipeline"
              className="px-5 py-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Ver pipeline
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
