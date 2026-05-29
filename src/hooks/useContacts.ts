import { useCallback, useEffect, useMemo, useState } from "react";
import { get } from "../lib/api";
import { useOpportunities, type Opportunity } from "./useOpportunities";
import { useOrganizations, type Organization } from "./useOrganizations";
import { useTasks, type Task } from "./useTasks";

export interface Contact {
  id: string;
  organization_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
  created_at?: string;
}

export interface ContactWithOrg extends Contact {
  organization?: Organization;
  opportunities: Opportunity[];
  tasks: Task[];
}

interface OrgFull extends Organization {
  crm_contacts?: Contact[];
}

function contactMatchesOpportunity(contact: Contact, opp: Opportunity) {
  return opp.contact_id === contact.id || (!opp.contact_id && opp.organization_id === contact.organization_id);
}

function contactMatchesTask(contact: Contact, task: Task, opportunities: Opportunity[]) {
  if (task.organization_id === contact.organization_id && !task.opportunity_id) return true;
  const opp = opportunities.find((o) => o.id === task.opportunity_id);
  return opp ? contactMatchesOpportunity(contact, opp) : false;
}

export function useContacts() {
  const { orgs, loading: orgsLoading } = useOrganizations();
  const { opps, stages, loading: oppsLoading, reload: reloadOpps } = useOpportunities();
  const { tasks, loading: tasksLoading, reload: reloadTasks } = useTasks();
  const [orgDetails, setOrgDetails] = useState<OrgFull[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (orgsLoading) return;
    if (orgs.length === 0) {
      setOrgDetails([]);
      setLoadingContacts(false);
      return;
    }

    setLoadingContacts(true);
    setError(null);
    try {
      const details = await Promise.all(
        orgs.map(async (org) => {
          try {
            return await get<OrgFull>(`/organizations/${org.id}`);
          } catch {
            return { ...org, crm_contacts: [] };
          }
        })
      );
      setOrgDetails(details);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingContacts(false);
    }
  }, [orgs, orgsLoading]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const contacts = useMemo<ContactWithOrg[]>(() => {
    return orgDetails.flatMap((org) =>
      (org.crm_contacts ?? []).map((contact) => {
        const opportunities = opps.filter((opp) => contactMatchesOpportunity(contact, opp));
        return {
          ...contact,
          organization: org,
          opportunities,
          tasks: tasks.filter((task) => contactMatchesTask(contact, task, opportunities)),
        };
      })
    );
  }, [opps, orgDetails, tasks]);

  const reload = useCallback(async () => {
    await Promise.all([loadDetails(), reloadOpps(), reloadTasks()]);
  }, [loadDetails, reloadOpps, reloadTasks]);

  return {
    contacts,
    stages,
    loading: orgsLoading || oppsLoading || tasksLoading || loadingContacts,
    error,
    reload,
  };
}
