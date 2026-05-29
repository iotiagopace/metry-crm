import { useState, useEffect, useCallback } from "react";
import { get, post, put, del } from "../lib/api";
import { useAuth } from "./useAuth";
import { canSeeAssigned } from "../lib/team";

export interface Organization {
  id: string;
  name: string;
  cnpj?: string;
  segment?: string;
  city?: string;
  state?: string;
  website?: string;
  notes?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export function useOrganizations() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<Organization[]>("/organizations");
      setOrgs(data.filter((org) => canSeeAssigned(user, org.owner_id)));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data: Partial<Organization>) => {
    await post("/organizations", data);
    await load();
  };
  const update = async (id: string, data: Partial<Organization>) => {
    await put(`/organizations/${id}`, data);
    await load();
  };
  const remove = async (id: string) => {
    await del(`/organizations/${id}`);
    await load();
  };

  return { orgs, loading, error, create, update, remove, reload: load };
}
