import { useState } from "react";
import { Phone, Mail, MessageCircle, Users, StickyNote, Plus, Loader2, Trash2 } from "lucide-react";
import { post, del } from "../lib/api";

const TYPES = [
  { id: "call",     label: "Ligação",  Icon: Phone },
  { id: "email",    label: "Email",    Icon: Mail },
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { id: "meeting",  label: "Reunião",  Icon: Users },
  { id: "note",     label: "Nota",     Icon: StickyNote },
] as const;

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface Props {
  opportunityId: string;
  organizationId?: string;
  activities: Activity[];
  onAdd: () => void;
}

export function ActivityFeed({ opportunityId, organizationId, activities, onAdd }: Props) {
  const [type, setType] = useState<string>("note");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!desc.trim()) return;
    setSaving(true);
    try {
      await post("/activities", {
        type,
        description: desc.trim(),
        opportunity_id: opportunityId,
        organization_id: organizationId,
      });
      setDesc("");
      onAdd();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await del(`/activities/${id}`);
    onAdd();
  };

  return (
    <div className="space-y-4">
      {/* Add */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                type === id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:border-blue-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descreva a interação..."
            rows={2}
            className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving || !desc.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 transition-colors self-end"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </div>
      </div>

      {/* Log */}
      <div className="space-y-2">
        {activities.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-4">
            Nenhuma interação registrada ainda
          </p>
        )}
        {activities.map((act) => {
          const t = TYPES.find((x) => x.id === act.type);
          const Icon = t?.Icon ?? StickyNote;
          return (
            <div key={act.id} className="flex gap-3 items-start group">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-neutral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-800 leading-snug">{act.description}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {t?.label} ·{" "}
                  {new Date(act.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => remove(act.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-300 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
