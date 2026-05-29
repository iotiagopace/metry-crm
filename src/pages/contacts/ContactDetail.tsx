import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft, BriefcaseBusiness, CalendarClock, Circle,
  FileText, Mail, MapPin, MessageCircle, Phone, Plus,
} from "lucide-react";
import { ActivityFeed } from "../../components/ActivityFeed";
import { ContactButtons } from "../../components/ContactButtons";
import { Stars } from "../../components/Stars";
import { get, post } from "../../lib/api";
import { useContacts } from "../../hooks/useContacts";
import { useOpportunities, type Opportunity } from "../../hooks/useOpportunities";
import { useTasks } from "../../hooks/useTasks";

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface OppFull extends Opportunity {
  crm_activities?: Activity[];
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(date?: string) {
  if (!date) return "Sem data";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function sourceLabel(contactCreated?: string) {
  if (!contactCreated) return "Manual";
  const days = Math.floor((Date.now() - new Date(contactCreated).getTime()) / 86400000);
  return days <= 7 ? "Novo lead" : "Cadastro";
}

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contacts, loading, stages, reload } = useContacts();
  const { update } = useOpportunities();
  const { complete } = useTasks();
  const [opportunityDetails, setOpportunityDetails] = useState<OppFull[]>([]);
  const [newTask, setNewTask] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const contact = contacts.find((item) => item.id === id);

  const loadOpportunityDetails = useCallback(async () => {
    if (!contact) return;
    const details = await Promise.all(
      contact.opportunities.map(async (opp) => {
        try {
          return await get<OppFull>(`/opportunities/${opp.id}`);
        } catch {
          return { ...opp, crm_activities: [] };
        }
      })
    );
    setOpportunityDetails(details);
  }, [contact]);

  useEffect(() => {
    loadOpportunityDetails();
  }, [loadOpportunityDetails]);

  const activities = useMemo(() => {
    return opportunityDetails
      .flatMap((opp) => (opp.crm_activities ?? []).map((activity) => ({ ...activity, opportunityTitle: opp.title })))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [opportunityDetails]);

  const openOpportunities = contact?.opportunities.filter((opp) => !opp.crm_stages?.is_won && !opp.crm_stages?.is_lost) ?? [];
  const pendingTasks = contact?.tasks.filter((task) => !task.completed).sort((a, b) => a.due_date.localeCompare(b.due_date)) ?? [];
  const bestQualification = contact?.opportunities.reduce((max, opp) => Math.max(max, opp.qualification ?? 0), 0) ?? 0;
  const totalPipeline = openOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  const primaryOpportunity = openOpportunities[0] ?? contact?.opportunities[0];

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contact || !newTask.trim()) return;
    setSavingTask(true);
    try {
      await post("/tasks", {
        title: newTask.trim(),
        due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        organization_id: contact.organization_id,
        opportunity_id: primaryOpportunity?.id,
      });
      setNewTask("");
      await reload();
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 text-center text-[#737686]">
        <p className="text-lg font-semibold mb-2 text-[#1a1c1c]">Contato não encontrado</p>
        <Link to="/contacts" className="text-[#2563eb] hover:underline text-sm">Voltar para contatos</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/contacts")} className="p-2 hover:bg-[#eeeeee] rounded-xl transition-colors text-[#737686]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#1a1c1c] truncate">{contact.name}</h1>
          <p className="text-sm text-[#737686] truncate">{contact.role ? `${contact.role} · ` : ""}{contact.organization?.name ?? "Sem empresa"}</p>
        </div>
        <ContactButtons email={contact.email} phone={contact.phone} />
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-4 items-start">
        <aside className="space-y-4">
          <section className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center text-lg font-bold">
                {initials(contact.name)}
              </div>
              <div>
                <p className="font-bold text-[#1a1c1c]">{contact.name}</p>
                <span className="inline-flex mt-1 border border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {sourceLabel(contact.created_at)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-[#434655] hover:text-[#2563eb]"><Mail size={15} />{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-[#434655] hover:text-[#2563eb]"><Phone size={15} />{contact.phone}</a>}
              {contact.phone && <a href={`https://wa.me/${contact.phone.replace(/\D/g, "").startsWith("55") ? contact.phone.replace(/\D/g, "") : `55${contact.phone.replace(/\D/g, "")}`}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-[#434655] hover:text-green-600"><MessageCircle size={15} />Abrir WhatsApp</a>}
              {contact.organization && <Link to={`/organizations/${contact.organization.id}`} className="flex items-center gap-2.5 text-[#434655] hover:text-[#2563eb]"><BriefcaseBusiness size={15} />{contact.organization.name}</Link>}
              {(contact.organization?.city || contact.organization?.state) && <p className="flex items-center gap-2.5 text-[#737686]"><MapPin size={15} />{[contact.organization.city, contact.organization.state].filter(Boolean).join(", ")}</p>}
            </div>

            <div className="mt-5 pt-5 border-t border-[#f5f5f5]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-2">Qualificação</p>
              <Stars value={bestQualification} size={18} />
            </div>
          </section>

          <section className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737686] mb-3">Resumo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-[#2563eb]">{contact.opportunities.length}</p>
                <p className="text-xs text-[#737686]">negócios</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#b45309]">{pendingTasks.length}</p>
                <p className="text-xs text-[#737686]">tarefas</p>
              </div>
              <div className="col-span-2">
                <p className="text-lg font-bold text-[#15803d]">{fmtMoney(totalPipeline)}</p>
                <p className="text-xs text-[#737686]">pipeline aberto</p>
              </div>
            </div>
          </section>
        </aside>

        <main className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
            <h2 className="font-semibold text-[#1a1c1c] text-sm">Timeline de atividades</h2>
            <p className="text-xs text-[#737686] mt-0.5">Interações, notas, tarefas e histórico comercial do contato</p>
          </div>

          <div className="p-5">
            {primaryOpportunity ? (
              <div className="mb-5">
                <ActivityFeed
                  opportunityId={primaryOpportunity.id}
                  organizationId={contact.organization_id}
                  activities={activities}
                  onAdd={loadOpportunityDetails}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d4d4d4] p-6 text-center text-sm text-[#737686]">
                Nenhuma oportunidade vinculada ainda. Crie um negócio no pipeline para registrar interações completas.
              </div>
            )}
          </div>
        </main>

        <aside className="space-y-4">
          <section className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
              <h2 className="font-semibold text-[#1a1c1c] text-sm">Negócios ativos</h2>
            </div>
            <div className="p-4 space-y-3">
              {openOpportunities.length === 0 && <p className="text-sm text-[#737686] text-center py-4">Nenhum negócio ativo</p>}
              {openOpportunities.map((opp) => (
                <div key={opp.id} className="border border-[#e5e5e5] rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1a1c1c] leading-tight">{opp.title}</p>
                      <p className="text-xs text-[#737686] mt-1">{fmtMoney(opp.value)} · {fmtDate(opp.expected_close)}</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: opp.crm_stages?.color ?? "#64748b" }} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <select
                      value={opp.stage_id}
                      onChange={async (event) => {
                        await update(opp.id, { stage_id: event.target.value });
                        await reload();
                      }}
                      className="flex-1 px-2 py-1.5 border border-[#e5e5e5] rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#2563eb] outline-none"
                    >
                      {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                    </select>
                    <Stars value={opp.qualification} size={12} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e5e5] bg-[#f9f9f9]">
              <h2 className="font-semibold text-[#1a1c1c] text-sm">Tarefas pendentes</h2>
            </div>
            <div className="p-4">
              <form onSubmit={addTask} className="flex gap-2 mb-4">
                <input
                  value={newTask}
                  onChange={(event) => setNewTask(event.target.value)}
                  placeholder="Nova tarefa rápida..."
                  className="min-w-0 flex-1 px-3 py-2 border border-[#e5e5e5] rounded-xl text-sm focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
                <button disabled={savingTask || !newTask.trim()} className="w-10 h-10 rounded-xl bg-[#2563eb] text-white flex items-center justify-center disabled:opacity-40">
                  <Plus size={16} />
                </button>
              </form>

              <div className="space-y-2">
                {pendingTasks.length === 0 && <p className="text-sm text-[#737686] text-center py-4">Nenhuma tarefa pendente</p>}
                {pendingTasks.map((task) => {
                  const overdue = task.due_date < new Date().toISOString().slice(0, 10);
                  return (
                    <button
                      key={task.id}
                      onClick={async () => {
                        await complete(task.id);
                        await reload();
                      }}
                      className="w-full text-left flex gap-3 p-3 rounded-xl border border-[#e5e5e5] hover:border-[#2563eb] transition-colors"
                    >
                      {overdue ? <CalendarClock size={16} className="text-red-500 shrink-0 mt-0.5" /> : <Circle size={16} className="text-[#a0a0a0] shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1a1c1c] leading-tight">{task.title}</p>
                        <p className={`text-xs mt-1 ${overdue ? "text-red-500 font-semibold" : "text-[#737686]"}`}>{fmtDate(task.due_date)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <h2 className="font-semibold text-[#1a1c1c] text-sm mb-3">Arquivos</h2>
            <div className="rounded-xl border border-dashed border-[#d4d4d4] p-4 text-center">
              <FileText size={22} className="mx-auto text-[#737686] mb-2" />
              <p className="text-sm font-medium text-[#434655]">Área pronta para documentos</p>
              <p className="text-xs text-[#737686] mt-1">PDFs enviados pelo site ou WhatsApp podem aparecer aqui quando o upload for conectado.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
