import { useState, useEffect, useCallback } from "react";
import { get, post, put, del } from "../lib/api";

export interface Task {
  id: string;
  title: string;
  opportunity_id?: string;
  organization_id?: string;
  assigned_to?: string;
  due_date: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  crm_organizations?: { id: string; name: string };
  crm_opportunities?: { id: string; title: string };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await get<Task[]>("/tasks"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data: Partial<Task>) => {
    await post("/tasks", data);
    await load();
  };
  const complete = async (id: string) => {
    await put(`/tasks/${id}`, { completed: true });
    await load();
  };
  const remove = async (id: string) => {
    await del(`/tasks/${id}`);
    await load();
  };

  return { tasks, loading, create, complete, remove, reload: load };
}
