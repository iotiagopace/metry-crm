import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Trash2, Plus, Edit, Globe, Hash, MapPin } from "lucide-react";
import { get, post, del } from "../../lib/api";
import { ContactButtons } from "../../components/ContactButtons";
import { OrgForm } from "./OrgForm";
import { useOrganizations, type Organization } from "../../hooks/useOrganizations";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface OrgFull extends Organization {
  crm_contacts: Contact[];
}

export function OrgDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { update, remove: removeOrg } = useOrganizations();
  const [org, setOrg] = useState<OrgFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", role: "" });
  const [savingContact, setSavingContact] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setOrg(await get<OrgFull>(`/organizations/${id}`));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!confirm(`Excluir "${org?.name}"? Todos os contatos associados serão removidos.`)) return;
    await removeOrg(id!);
    navigate("/organizations");
  };

  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      await post(`/organizations/${id}/contacts`, newContact);
      setAddingContact(false);
      setNewContact({ name: "", email: "", phone: "", role: "" });
      load();
    } finally {
      setSavingContact(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm("Excluir este contato?")) return;
    await del(`/contacts/${contactId}`);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 text-center text-neutral-500">
        <p className="text-lg font-semibold mb-2">Cliente não encontrado</p>
        <Link to="/organizations" className="text-blue-600 hover:underline text-sm">
          Voltar para clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/organizations"
          className="p-2 hover:bg-neutral-200 rounded-xl transition-colors text-neutral-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-neutral-900 truncate">{org.name}</h1>
          {org.segment && <p className="text-sm text-neutral-500">{org.segment}</p>}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-xl transition-colors"
          title="Editar"
        >
          <Edit size={17} />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
          title="Excluir"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Info card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
          <h2 className="font-semibold text-neutral-800 text-sm">Informações</h2>

          {org.cnpj && (
            <div className="flex items-start gap-2.5">
              <Hash size={14} className="text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">CNPJ</p>
                <p className="text-sm text-neutral-800 font-mono">{org.cnpj}</p>
              </div>
            </div>
          )}

          {(org.city || org.state) && (
            <div className="flex items-start gap-2.5">
              <MapPin size={14} className="text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">Localização</p>
                <p className="text-sm text-neutral-800">
                  {[org.city, org.state].filter(Boolean).join(" — ")}
                </p>
              </div>
            </div>
          )}

          {org.website && (
            <div className="flex items-start gap-2.5">
              <Globe size={14} className="text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">Website</p>
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate block max-w-[200px]"
                >
                  {org.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          )}

          {org.notes && (
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 mb-1">Observações</p>
              <p className="text-sm text-neutral-700 leading-relaxed">{org.notes}</p>
            </div>
          )}

          {!org.cnpj && !org.city && !org.website && !org.notes && (
            <p className="text-sm text-neutral-400 py-2">Nenhuma informação adicional</p>
          )}
        </div>

        {/* Contacts card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-neutral-800 text-sm">
              Contatos ({org.crm_contacts?.length ?? 0})
            </h2>
            <button
              onClick={() => setAddingContact((v) => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
            >
              <Plus size={13} />
              Adicionar
            </button>
          </div>

          {addingContact && (
            <form
              onSubmit={saveContact}
              className="bg-neutral-50 rounded-xl p-3 mb-3 space-y-2 border border-neutral-200"
            >
              {(
                [
                  ["name", "Nome *", "text", true],
                  ["role", "Cargo", "text", false],
                  ["email", "Email", "email", false],
                  ["phone", "Telefone", "tel", false],
                ] as const
              ).map(([k, label, type, req]) => (
                <input
                  key={k}
                  placeholder={label}
                  type={type}
                  required={req}
                  value={newContact[k]}
                  onChange={(e) =>
                    setNewContact((f) => ({ ...f, [k]: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              ))}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddingContact(false)}
                  className="flex-1 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingContact ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {org.crm_contacts?.length === 0 && !addingContact && (
              <p className="text-sm text-neutral-400 text-center py-6">
                Nenhum contato cadastrado
              </p>
            )}
            {org.crm_contacts?.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-neutral-50 group transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{c.name}</p>
                  {c.role && <p className="text-xs text-neutral-400">{c.role}</p>}
                  {c.email && (
                    <p className="text-xs text-neutral-400 truncate">{c.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ContactButtons email={c.email} phone={c.phone} />
                  <button
                    onClick={() => deleteContact(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-300 hover:text-red-400 transition-all rounded-lg"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <OrgForm
          initial={org}
          onClose={() => setEditing(false)}
          onSave={async (d) => {
            await update(org.id, d);
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}
