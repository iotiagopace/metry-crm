import { useState, useEffect, useCallback } from "react";
import { Loader2, Calendar, DollarSign } from "lucide-react";
import { Modal } from "../../components/Modal";
import { Stars } from "../../components/Stars";
import { ActivityFeed } from "../../components/ActivityFeed";
import { ContactButtons } from "../../components/ContactButtons";
import { get } from "../../lib/api";
import { useOpportunities, type Opportunity, type Stage } from "../../hooks/useOpportunities";

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface OppFull extends Opportunity {
  crm_activities: Activity[];
}

interface Props {
  opp: Opportunity;
  stages: Stage[];
  onClose: () => void;
  onChange: () => void;
}

export function OpportunityModal({ opp, stages, onClose, onChange }: Props) {
  const { update } = useOpportunities();
  const [full, setFull] = useState<OppFull | null>(null);
  const [localOpp, setLocalOpp] = useState(opp);
  const [saving, setSaving] = useState(false);

  const loadFull = useCallback(async () => {
    const data = await get<OppFull>(`/opportunities/${opp.id}`);
    setFull(data);
    setLocalOpp((prev) => ({ ...prev, ...data }));
  }, [opp.id]);

  useEffect(() => {
    loadFull();
  }, [loadFull]);

  const save = async (patch: Partial<Opportunity>) => {
    setSaving(true);
    setLocalOpp((prev) => ({ ...prev, ...patch }));
    try {
      await update(opp.id, patch);
      onChange();
    } finally {
      setSaving(false);
    }
  };

  const contact = full?.crm_contacts;
  const org = full?.crm_organizations;

  return (
    <Modal title={localOpp.title} onClose={onClose} width="max-w-xl">
      <div className="divide-y divide-neutral-100">

        {/* Stage selector */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2.5">
            Etapa do pipeline
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {stages.map((s) => {
              const active = localOpp.stage_id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => save({ stage_id: s.id })}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-60"
                  style={
                    active
                      ? { backgroundColor: s.color, borderColor: s.color, color: "#fff" }
                      : { backgroundColor: s.color + "15", borderColor: s.color + "40", color: s.color }
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: active ? "#fff" : s.color }}
                  />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Qualification + Value */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
              Qualificação
            </p>
            <Stars
              value={localOpp.qualification}
              onChange={(q) => save({ qualification: q })}
              size={18}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
              Valor (R$)
            </p>
            <div className="relative">
              <DollarSign size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="number"
                defaultValue={localOpp.value || ""}
                onBlur={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  if (v !== localOpp.value) save({ value: v });
                }}
                className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Expected close */}
        <div className="px-5 py-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
            Previsão de fechamento
          </p>
          <div className="relative w-44">
            <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="date"
              defaultValue={localOpp.expected_close ?? ""}
              onBlur={(e) => {
                if (e.target.value !== localOpp.expected_close) {
                  save({ expected_close: e.target.value || undefined });
                }
              }}
              className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Org + Contact */}
        {(org || contact) && (
          <div className="px-5 py-4 space-y-3">
            {org && (
              <div>
                <p className="text-xs text-neutral-400 font-medium mb-0.5">Empresa</p>
                <p className="text-sm font-semibold text-neutral-900">{org.name}</p>
              </div>
            )}
            {contact && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 font-medium mb-0.5">Contato</p>
                  <p className="text-sm font-semibold text-neutral-900">{contact.name}</p>
                  {contact.email && (
                    <p className="text-xs text-neutral-400">{contact.email}</p>
                  )}
                </div>
                <ContactButtons email={contact.email} phone={contact.phone} />
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
            Notas
          </p>
          <textarea
            defaultValue={localOpp.notes ?? ""}
            onBlur={(e) => {
              if (e.target.value !== localOpp.notes) save({ notes: e.target.value });
            }}
            rows={3}
            placeholder="Adicione notas sobre esta oportunidade..."
            className="w-full text-sm border border-neutral-200 rounded-xl px-3 py-2.5 resize-none focus:ring-2 focus:ring-blue-500 outline-none bg-neutral-50 transition"
          />
        </div>

        {/* Activity feed */}
        <div className="px-5 py-4 pb-6">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            Histórico de interações
          </p>
          {full ? (
            <ActivityFeed
              opportunityId={opp.id}
              organizationId={opp.organization_id}
              activities={full.crm_activities ?? []}
              onAdd={loadFull}
            />
          ) : (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-neutral-300" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
