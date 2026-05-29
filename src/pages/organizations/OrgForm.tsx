import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "../../components/Modal";
import type { Organization } from "../../hooks/useOrganizations";

const SEGMENTS = [
  "Indústria e Comércio",
  "Saúde e Odontologia",
  "Tecnologia e Software",
  "Serviços e Varejo",
  "Alimentação",
  "Educação",
  "Religioso e Social",
  "Comunicação e Mídia",
  "Outros",
];

interface Props {
  initial?: Partial<Organization>;
  onClose: () => void;
  onSave: (data: Partial<Organization>) => Promise<void>;
}

export function OrgForm({ initial = {}, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    segment: "",
    city: "",
    state: "",
    website: "",
    notes: "",
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initial.id ? "Editar cliente" : "Novo cliente"} onClose={onClose}>
      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Nome da empresa *
            </label>
            <input
              required
              value={form.name}
              onChange={set("name")}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Ex: Silva Distribuidora Ltda"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              CNPJ
            </label>
            <input
              value={form.cnpj}
              onChange={set("cnpj")}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Segmento
            </label>
            <select
              value={form.segment}
              onChange={set("segment")}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
            >
              <option value="">Selecione...</option>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Cidade
            </label>
            <input
              value={form.city}
              onChange={set("city")}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              UF
            </label>
            <input
              value={form.state}
              onChange={set("state")}
              maxLength={2}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition uppercase"
              placeholder="SP"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Website
            </label>
            <input
              value={form.website}
              onChange={set("website")}
              type="url"
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="https://empresa.com.br"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Observações
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={3}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
