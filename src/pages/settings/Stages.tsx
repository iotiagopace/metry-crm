import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, ChevronRight, Database, Upload, Target, SlidersHorizontal, Puzzle, Tag, ShoppingBag, XCircle, Mail } from "lucide-react";
import { get, post, del } from "../../lib/api";
import type { Stage } from "../../hooks/useOpportunities";

const SETTINGS_ADVANCED = [
  { icon: SlidersHorizontal, label: "Etapas do Pipeline",  desc: "Gerencie as etapas do funil" },
  { icon: Upload,            label: "Importar dados",      desc: "CSV, Excel ou integração" },
  { icon: Target,            label: "Metas",               desc: "Defina metas de vendas" },
  { icon: Database,          label: "Preferências",        desc: "Configurações gerais" },
  { icon: Puzzle,            label: "Integrações",         desc: "Conecte ferramentas externas" },
];

const SETTINGS_CONTA = [
  { icon: Tag,        label: "Segmentos",           desc: "Categorias de clientes" },
  { icon: ShoppingBag, label: "Produtos",           desc: "Catálogo de produtos/serviços" },
  { icon: XCircle,   label: "Motivo de perda",      desc: "Por que negócios são perdidos" },
  { icon: Mail,      label: "Modelos de e-mail",    desc: "Templates para comunicação" },
];

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
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1a1c1c]">Configurações</h1>
        <p className="text-[#737686] text-sm mt-0.5">Personalize o CRM para o seu negócio</p>
      </div>

      {/* Settings grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Avançado */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-3">Avançado</p>
          <div className="space-y-2">
            {SETTINGS_ADVANCED.map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                className="flex items-center gap-3 p-4 bg-white border border-[#e5e5e5] rounded-xl hover:border-[#2563eb] cursor-pointer transition-all w-full text-left"
              >
                <div className="w-9 h-9 bg-[#f5f5f5] rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#434655]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1c1c]">{label}</p>
                  <p className="text-xs text-[#737686]">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-[#737686] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Conta */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-3">Conta</p>
          <div className="space-y-2">
            {SETTINGS_CONTA.map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                className="flex items-center gap-3 p-4 bg-white border border-[#e5e5e5] rounded-xl hover:border-[#2563eb] cursor-pointer transition-all w-full text-left"
              >
                <div className="w-9 h-9 bg-[#f5f5f5] rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#434655]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1c1c]">{label}</p>
                  <p className="text-xs text-[#737686]">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-[#737686] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline stages editor */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
          <h2 className="font-semibold text-[#1a1c1c] text-sm">Etapas do Pipeline</h2>
          <p className="text-xs text-[#737686] mt-0.5">
            As etapas marcadas como "Ganho" ou "Perdido" não podem ser excluídas.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-[#f5f5f5]">
            {stages.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f9f9f9] transition-colors"
              >
                <span className="text-xs text-[#d4d4d4] font-mono w-4">{i + 1}</span>
                <div
                  className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1 text-sm font-medium text-[#1a1c1c]">{s.label}</span>
                {s.is_won && (
                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-semibold">
                    Ganho
                  </span>
                )}
                {s.is_lost && (
                  <span className="text-xs bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-semibold">
                    Perdido
                  </span>
                )}
                {!s.is_won && !s.is_lost && (
                  <button
                    onClick={() => deleteStage(s.id, s.label)}
                    className="p-1.5 text-[#d4d4d4] hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
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
          className="flex items-center gap-2.5 px-5 py-4 border-t border-[#e5e5e5] bg-[#f9f9f9]"
        >
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-9 h-9 border border-[#e5e5e5] rounded-lg cursor-pointer bg-white p-0.5"
            title="Cor da etapa"
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nome da nova etapa..."
            className="flex-1 px-3 py-2 border border-[#d4d4d4] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white"
          />
          <button
            type="submit"
            disabled={saving || !newLabel.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors shrink-0"
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
    </div>
  );
}
