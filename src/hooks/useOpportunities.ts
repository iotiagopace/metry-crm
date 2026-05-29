import { useState, useEffect, useCallback } from "react";
import { get, post, put, del } from "../lib/api";
import { useAuth } from "./useAuth";
import { canSeeAssigned } from "../lib/team";

export interface Stage {
  id: string;
  label: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  organization_id?: string;
  contact_id?: string;
  stage_id: string;
  value: number;
  expected_close?: string;
  owner_id?: string;
  qualification: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  crm_stages?: Stage;
  crm_organizations?: { id: string; name: string };
  crm_contacts?: { id: string; name: string; phone?: string; email?: string };
}

export function useOpportunities() {
  const { user } = useAuth();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oppsData, stagesData] = await Promise.all([
        get<Opportunity[]>("/opportunities"),
        get<Stage[]>("/settings/stages"),
      ]);
      setOpps(oppsData.filter((opp) => canSeeAssigned(user, opp.owner_id)));
      setStages(stagesData);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data: Partial<Opportunity>) => {
    const o = await post<Opportunity>("/opportunities", data);
    await load();
    return o;
  };
  const update = async (id: string, data: Partial<Opportunity>) => {
    await put(`/opportunities/${id}`, data);
    await load();
  };
  const remove = async (id: string) => {
    await del(`/opportunities/${id}`);
    await load();
  };

  return { opps, stages, loading, create, update, remove, reload: load };
}
