import { useState } from "react";
import { Plus, CheckCircle2, Circle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useTasks } from "../../hooks/useTasks";
import { Modal } from "../../components/Modal";
import { post } from "../../lib/api";

export function TaskList() {
  const { tasks, loading, complete, remove, reload } = useTasks();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", due_date: "" });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"pending" | "done">("pending");

  const today = new Date().toISOString().slice(0, 10);
  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  const shown = tab === "pending" ? pending : done;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await post("/tasks", form);
      await reload();
      setShowNew(false);
      setForm({ title: "", due_date: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tarefas</h1>
          <p className="text-neutral-500 text-sm">
            {pending.length} pendente{pending.length !== 1 ? "s" : ""}
            {done.length > 0 && ` · ${done.length} concluída${done.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 mb-4 w-fit">
        {(["pending", "done"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-white shadow text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t === "pending" ? `Pendentes (${pending.length})` : `Concluídas (${done.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {shown.length === 0 && (
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

          {shown.map((t) => {
            const overdue = !t.completed && t.due_date < today;
            const isToday = !t.completed && t.due_date === today;
            return (
              <div
                key={t.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors group ${
                  overdue
                    ? "border-red-200 bg-red-50"
                    : isToday
                    ? "border-orange-200 bg-orange-50"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <button
                  onClick={() => !t.completed && complete(t.id)}
                  className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                  disabled={t.completed}
                >
                  {t.completed ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : overdue ? (
                    <AlertCircle size={20} className="text-red-400" />
                  ) : (
                    <Circle size={20} className="text-neutral-300 hover:text-blue-500 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      t.completed ? "line-through text-neutral-400" : "text-neutral-900"
                    }`}
                  >
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-xs font-semibold ${
                        overdue
                          ? "text-red-600"
                          : isToday
                          ? "text-orange-600"
                          : "text-neutral-400"
                      }`}
                    >
                      {overdue && "⚠ Venceu em "}
                      {isToday && "Hoje · "}
                      {new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: t.due_date.startsWith(new Date().getFullYear().toString()) ? undefined : "numeric",
                      })}
                    </span>
                    {t.crm_organizations && (
                      <span className="text-xs text-neutral-400 truncate">
                        · {t.crm_organizations.name}
                      </span>
                    )}
                    {t.crm_opportunities && (
                      <span className="text-xs text-neutral-400 truncate">
                        · {t.crm_opportunities.title}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => remove(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-300 hover:text-red-400 transition-all rounded-lg shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <Modal title="Nova tarefa" onClose={() => setShowNew(false)}>
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Título *
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Ligar para cliente amanhã"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Data limite *
              </label>
              <input
                required
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
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
                Criar tarefa
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
