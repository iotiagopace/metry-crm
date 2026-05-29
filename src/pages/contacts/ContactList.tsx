import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Mail, Phone, Search, UserRound, X } from "lucide-react";
import { ContactButtons } from "../../components/ContactButtons";
import { Stars } from "../../components/Stars";
import { useContacts, type ContactWithOrg } from "../../hooks/useContacts";

const AVATAR_COLORS = ["#2563eb", "#7e22ce", "#15803d", "#b45309", "#0891b2", "#be185d"];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function bestQualification(contact: ContactWithOrg) {
  return contact.opportunities.reduce((max, opp) => Math.max(max, opp.qualification ?? 0), 0);
}

function statusFor(contact: ContactWithOrg) {
  const hasWon = contact.opportunities.some((opp) => opp.crm_stages?.is_won);
  const open = contact.opportunities.filter((opp) => !opp.crm_stages?.is_lost && !opp.crm_stages?.is_won);
  if (hasWon) return { label: "Cliente", className: "bg-green-50 text-green-700 border-green-200" };
  if (open.length > 0) return { label: "Em negociação", className: "bg-blue-50 text-blue-700 border-blue-200" };
  if (contact.tasks.some((task) => !task.completed)) return { label: "Follow-up", className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Lead", className: "bg-neutral-100 text-neutral-600 border-neutral-200" };
}

function fmtDate(date?: string) {
  if (!date) return "Sem registro";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ContactList() {
  const { contacts, loading } = useContacts();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter((contact) =>
      [
        contact.name,
        contact.email,
        contact.phone,
        contact.role,
        contact.organization?.name,
        contact.organization?.segment,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  const hotContacts = contacts.filter((contact) => bestQualification(contact) >= 4).length;
  const withOpenDeals = contacts.filter((contact) => contact.opportunities.some((opp) => !opp.crm_stages?.is_lost && !opp.crm_stages?.is_won)).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1a1c1c]">Contatos</h1>
          <p className="text-[#737686] text-sm">
            {loading ? "Carregando..." : `${filtered.length.toLocaleString("pt-BR")} contato${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: contacts.length, color: "#2563eb" },
          { label: "Qualificados", value: hotContacts, color: "#ef4444" },
          { label: "Com negócio ativo", value: withOpenDeals, color: "#15803d" },
          { label: "Pendências", value: contacts.filter((c) => c.tasks.some((t) => !t.completed)).length, color: "#b45309" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, empresa, email, telefone ou cargo..."
          className="w-full pl-9 pr-8 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none bg-white transition"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] hover:text-[#1a1c1c]">
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#737686] gap-3">
          <UserRound size={36} />
          <p className="text-sm font-medium">{search ? "Nenhum contato encontrado" : "Nenhum contato cadastrado ainda"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686]">Contato</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686] hidden lg:table-cell">Qualificação</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686] hidden md:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686] hidden xl:table-cell">Contato direto</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#737686]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {filtered.map((contact) => {
                const status = statusFor(contact);
                return (
                  <tr key={contact.id} className="hover:bg-[#f9f9f9] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: avatarColor(contact.name) }}>
                          {initials(contact.name)}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/contacts/${contact.id}`} className="font-semibold text-[#1a1c1c] hover:text-[#2563eb] transition-colors">
                            {contact.name}
                          </Link>
                          <p className="text-xs text-[#737686] truncate">
                            {contact.role ? `${contact.role} · ` : ""}{contact.organization?.name ?? "Sem empresa"}
                          </p>
                          <p className="text-[11px] text-[#a0a0a0] md:hidden">{fmtDate(contact.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Stars value={bestQualification(contact)} size={14} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex border px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="space-y-1">
                        {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-[#434655] hover:text-[#2563eb]"><Mail size={12} />{contact.email}</a>}
                        {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-[#434655] hover:text-[#2563eb]"><Phone size={12} />{contact.phone}</a>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ContactButtons email={contact.email} phone={contact.phone} />
                        <Link to={`/contacts/${contact.id}`} className="text-xs font-semibold text-[#2563eb] hover:underline">
                          Abrir
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
