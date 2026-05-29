import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { get, post, del } from "../../lib/api";
import type { Stage } from "../../hooks/useOpportunities";

export function SettingsStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setStages(await get<Stage[]>("/settings/stages"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      await post("/settings/stages", {
        label: newLabel.trim(),
        color: newColor,
        position: stages.length,
      });
      setNewLabel("");
      setNewColor("#6b7280");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deleteStage = async (id: string, label: string) => {
    if (
      !confirm(
        `Excluir a etapa "${label}"? Oportunidades nessa etapa não terão etapa atribuída.`
      )
    )
      return;
    await del(`/settings/stages/${id}`);
    await load();
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Configurações</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Personalize as etapas do pipeline de vendas
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
          <h2 className="font-semibold text-neutral-800 text-sm">Etapas do Pipeline</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            As etapas marcadas como "Ganho" ou "Perdido" não podem ser excluídas.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {stages.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors"
              >
                <span className="text-xs text-neutral-300 font-mono w-4">{i + 1}</span>
                <div
                  className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1 text-sm font-medium text-neutral-800">{s.label}</span>
                {s.is_won && (
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-semibold">
                    Ganho
                  </span>
                )}
                {s.is_lost && (
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-semibold">
                    Perdido
                  </span>
                )}
                {!s.is_won && !s.is_lost && (
                  <button
                    onClick={() => deleteStage(s.id, s.label)}
                    className="p-1.5 text-neutral-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                    title="Excluir etapa"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new stage */}
        <form
          onSubmit={addStage}
          className="flex items-center gap-2.5 px-5 py-4 border-t border-neutral-200 bg-neutral-50"
        >
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-9 h-9 border border-neutral-300 rounded-lg cursor-pointer bg-white p-0.5"
            title="Cor da etapa"
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nome da nova etapa..."
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
          <button
            type="submit"
            disabled={saving || !newLabel.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors shrink-0"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Adicionar
          </button>
        </form>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-700 font-semibold mb-1">💡 Personalizando para seu negócio</p>
        <p className="text-xs text-blue-600 leading-relaxed">
          Você pode criar etapas específicas para qualquer setor. Ex: para clínicas use
          "Consulta → Orçamento → Agendado → Em Tratamento". Para imobiliárias:
          "Visita → Proposta → Documentação → Fechado".
        </p>
      </div>
    </div>
  );
}
