import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Role = "super_admin" | "tenant_admin" | "seller";

type UserContext = {
  userId: string;
  userEmail?: string;
  tenantId?: string;
  role: Role;
  isSuperAdmin: boolean;
  memberships: Array<{ tenant_id: string; role: Role }>;
};

type LeadSource = "site_form" | "whatsapp_click" | "meta_lead_ads" | "manual";

const DEFAULT_STAGES = [
  { label: "Novo", color: "#64748b", position: 0, is_won: false, is_lost: false },
  { label: "Contatado", color: "#f97316", position: 1, is_won: false, is_lost: false },
  { label: "Proposta", color: "#8b5cf6", position: 2, is_won: false, is_lost: false },
  { label: "Negociação", color: "#eab308", position: 3, is_won: false, is_lost: false },
  { label: "Ganho", color: "#10b981", position: 4, is_won: true, is_lost: false },
  { label: "Perdido", color: "#ef4444", position: 5, is_won: false, is_lost: true },
];

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const app = new Hono().basePath("/crm-server");

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-CRM-Ingest-Key", "X-Tenant-Id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

function decodeJwt(token: string) {
  const b64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
  if (!b64) throw new Error("Invalid token");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return JSON.parse(atob(b64 + pad));
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function publicKey() {
  return `metry_public_${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().slice(0, 8)}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function getUserContext(c: any): Promise<UserContext | Response> {
  const header = c.req.header("Authorization");
  if (!header) return c.json({ error: "Unauthorized" }, 401);

  const token = header.replace(/^Bearer\s+/i, "").trim();
  try {
    const payload = decodeJwt(token);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: "Token expirado" }, 401);
    }

    const { data: memberships, error } = await supabase
      .from("crm_tenant_users")
      .select("tenant_id, role, active")
      .eq("user_id", payload.sub)
      .eq("active", true);

    if (error) return c.json({ error: error.message }, 500);
    if (!memberships?.length) return c.json({ error: "Usuário sem tenant ativo" }, 403);

    const activeMemberships = memberships as Array<{ tenant_id: string; role: Role; active: boolean }>;
    const isSuperAdmin = activeMemberships.some((item) => item.role === "super_admin");
    const requestedTenant = c.req.header("X-Tenant-Id") ?? undefined;
    const requestedMembership = activeMemberships.find((item) => item.tenant_id === requestedTenant);
    const selected = requestedMembership ?? activeMemberships[0];

    if (requestedTenant && !requestedMembership && !isSuperAdmin) {
      return c.json({ error: "Tenant não permitido" }, 403);
    }

    return {
      userId: payload.sub,
      userEmail: payload.email,
      tenantId: requestedTenant ?? selected.tenant_id,
      role: (requestedMembership?.role ?? selected.role) as Role,
      isSuperAdmin,
      memberships: activeMemberships.map(({ tenant_id, role }) => ({ tenant_id, role })),
    };
  } catch {
    return c.json({ error: "Token inválido" }, 401);
  }
}

async function requireAuth(c: any, next: any) {
  const header = c.req.header("Authorization");
  if (!header) return c.json({ error: "Unauthorized" }, 401);

  const token = header.replace(/^Bearer\s+/i, "").trim();
  try {
    const payload = decodeJwt(token);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: "Token expirado" }, 401);
    }

    const { data: memberships, error } = await supabase
      .from("crm_tenant_users")
      .select("tenant_id, role, active")
      .eq("user_id", payload.sub)
      .eq("active", true);

    if (error) return c.json({ error: error.message }, 500);
    if (!memberships?.length) return c.json({ error: "Usuário sem tenant ativo" }, 403);

    const activeMemberships = memberships as Array<{ tenant_id: string; role: Role; active: boolean }>;
    const isSuperAdmin = activeMemberships.some((item) => item.role === "super_admin");
    const requestedTenant = c.req.header("X-Tenant-Id") ?? undefined;
    const requestedMembership = activeMemberships.find((item) => item.tenant_id === requestedTenant);
    const selected = requestedMembership ?? activeMemberships[0];

    if (requestedTenant && !requestedMembership && !isSuperAdmin) {
      return c.json({ error: "Tenant não permitido" }, 403);
    }

    const ctx: UserContext = {
      userId: payload.sub,
      userEmail: payload.email,
      tenantId: requestedTenant ?? selected.tenant_id,
      role: (requestedMembership?.role ?? selected.role) as Role,
      isSuperAdmin,
      memberships: activeMemberships.map(({ tenant_id, role }) => ({ tenant_id, role })),
    };

    c.set("auth", ctx);
    c.set("userId", ctx.userId);
    c.set("tenantId", ctx.tenantId);
    await next();
  } catch {
    return c.json({ error: "Token inválido" }, 401);
  }
}

function auth(c: any) {
  return c.get("auth") as UserContext;
}

function protect(path: string) {
  app.use(path, requireAuth);
  app.use(`${path}/*`, requireAuth);
}

function scopeQuery(c: any, query: any) {
  const ctx = auth(c);
  if (ctx.isSuperAdmin && !c.req.header("X-Tenant-Id")) return query;
  return query.eq("tenant_id", ctx.tenantId);
}

function tenantForWrite(c: any, body: Record<string, unknown> = {}) {
  const ctx = auth(c);
  if (ctx.isSuperAdmin && typeof body.tenant_id === "string") return body.tenant_id;
  return ctx.tenantId;
}

async function logIngestion(input: {
  tenant_id?: string;
  integration_id?: string;
  source: string;
  status: "received" | "created" | "duplicate" | "error" | "rejected";
  message?: string;
  payload?: unknown;
  contact_id?: string;
  opportunity_id?: string;
}) {
  await supabase.from("crm_ingestion_logs").insert({
    tenant_id: input.tenant_id,
    integration_id: input.integration_id,
    source: input.source,
    status: input.status,
    message: input.message,
    payload: input.payload ?? {},
    contact_id: input.contact_id,
    opportunity_id: input.opportunity_id,
  });
}

async function resolveIngestionKey(c: any) {
  const key = c.req.header("X-CRM-Ingest-Key") ?? c.req.query("key");
  if (!key) return null;

  const keyHash = await sha256(key);
  const { data, error } = await supabase
    .from("crm_integration_keys")
    .select("*, crm_tenants(*)")
    .eq("key_hash", keyHash)
    .eq("active", true)
    .single();

  if (error || !data) return null;

  await supabase.from("crm_integration_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return data as { id: string; tenant_id: string; allowed_domains: string[] };
}

async function firstStageForTenant(tenantId: string) {
  const { data } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("tenant_id", tenantId)
    .order("position")
    .limit(1);
  return data?.[0]?.id;
}

async function findDuplicateContact(tenantId: string, email?: string, phone?: string) {
  let query = supabase.from("crm_contacts").select("*").eq("tenant_id", tenantId).limit(1);
  const clauses = [];
  if (email) clauses.push(`email.eq.${email}`);
  if (phone) clauses.push(`phone.eq.${phone}`);
  if (!clauses.length) return null;
  const { data } = await query.or(clauses.join(","));
  return data?.[0] ?? null;
}

async function createLead(tenantId: string, payload: Record<string, any>, source: LeadSource, integrationId?: string) {
  const name = String(payload.name ?? payload.nome ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase() || undefined;
  const phone = String(payload.phone ?? payload.telefone ?? payload.whatsapp ?? "").trim() || undefined;
  const message = String(payload.message ?? payload.mensagem ?? "").trim();

  if (!name && !email && !phone) {
    await logIngestion({ tenant_id: tenantId, integration_id: integrationId, source, status: "rejected", message: "Lead sem nome, email ou telefone", payload });
    return { error: "Informe nome, email ou telefone", status: 400 };
  }

  const duplicate = await findDuplicateContact(tenantId, email, phone);
  if (duplicate) {
    await logIngestion({ tenant_id: tenantId, integration_id: integrationId, source, status: "duplicate", message: "Contato já existia", payload, contact_id: duplicate.id });
    return { contact: duplicate, duplicate: true };
  }

  let organizationId = payload.organization_id;
  const company = String(payload.company ?? payload.empresa ?? "").trim();
  if (!organizationId && company) {
    const { data: org } = await supabase
      .from("crm_organizations")
      .insert({ tenant_id: tenantId, name: company, website: payload.website, notes: payload.segment })
      .select()
      .single();
    organizationId = org?.id;
  }

  const { data: contact, error: contactError } = await supabase
    .from("crm_contacts")
    .insert({
      tenant_id: tenantId,
      organization_id: organizationId,
      name: name || email || phone,
      email,
      phone,
      role: payload.role ?? payload.cargo,
      notes: message,
    })
    .select()
    .single();

  if (contactError) {
    await logIngestion({ tenant_id: tenantId, integration_id: integrationId, source, status: "error", message: contactError.message, payload });
    return { error: contactError.message, status: 400 };
  }

  const stageId = await firstStageForTenant(tenantId);
  const { data: opportunity } = await supabase
    .from("crm_opportunities")
    .insert({
      tenant_id: tenantId,
      title: payload.opportunity_title ?? `Lead: ${contact.name}`,
      organization_id: organizationId,
      contact_id: contact.id,
      stage_id: stageId,
      value: Number(payload.value ?? 0),
      qualification: Number(payload.qualification ?? 0),
      notes: [
        message,
        payload.utm_source ? `UTM source: ${payload.utm_source}` : "",
        payload.campaign_name ? `Campanha: ${payload.campaign_name}` : "",
      ].filter(Boolean).join("\n"),
    })
    .select()
    .single();

  await logIngestion({
    tenant_id: tenantId,
    integration_id: integrationId,
    source,
    status: "created",
    message: "Lead criado",
    payload,
    contact_id: contact.id,
    opportunity_id: opportunity?.id,
  });

  return { contact, opportunity, duplicate: false };
}

// ── Auth ────────────────────────────────────────────────────────────────────
app.post("/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email e senha obrigatórios" }, 400);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return c.json({ error: error.message }, 401);

    const { data: memberships } = await supabase
      .from("crm_tenant_users")
      .select("tenant_id, role, crm_tenants(id,name,slug,domain)")
      .eq("user_id", data.user!.id)
      .eq("active", true);

    const first = memberships?.[0] as any;

    return c.json({
      access_token: data.session!.access_token,
      user: {
        id: data.user!.id,
        email: data.user!.email,
        name: data.user!.user_metadata?.name ?? data.user!.email,
        tenant_id: first?.tenant_id,
        role: first?.role ?? "seller",
        is_super_admin: memberships?.some((item: any) => item.role === "super_admin") ?? false,
        tenants: memberships ?? [],
      },
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ── Tenant provisioning ──────────────────────────────────────────────────────
protect("/tenants");

app.get("/tenants", async (c) => {
  const ctx = auth(c);
  const query = supabase.from("crm_tenants").select("*").order("created_at", { ascending: false });
  const { data, error } = ctx.isSuperAdmin ? await query : await query.eq("id", ctx.tenantId);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.post("/tenants", async (c) => {
  const ctx = auth(c);
  if (!ctx.isSuperAdmin) return c.json({ error: "Apenas super admin pode provisionar clientes" }, 403);

  const body = await c.req.json();
  const slug = slugify(body.slug ?? body.name);
  const { data: tenant, error } = await supabase
    .from("crm_tenants")
    .insert({
      name: body.name,
      slug,
      domain: body.domain,
      default_lead_source: body.default_lead_source ?? "site_form",
      settings: body.settings ?? {},
    })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);

  await supabase.from("crm_stages").insert(DEFAULT_STAGES.map((stage) => ({ ...stage, tenant_id: tenant.id })));

  const key = publicKey();
  await supabase.from("crm_integration_keys").insert({
    tenant_id: tenant.id,
    label: "Chave pública inicial",
    key_prefix: key.slice(0, 18),
    key_hash: await sha256(key),
    allowed_domains: body.domain ? [body.domain] : [],
  });

  await supabase.from("crm_integrations").insert([
    { tenant_id: tenant.id, type: "site", name: "Site / formulário padrão", config: { domains: body.domain ? [body.domain] : [] } },
    { tenant_id: tenant.id, type: "manual", name: "Cadastro manual", config: {} },
  ]);

  return c.json({ tenant, ingestion_key: key }, 201);
});

// ── Team ─────────────────────────────────────────────────────────────────────
app.get("/team", requireAuth, async (c) => {
  const query = supabase
    .from("crm_tenant_users")
    .select("*, crm_tenants(id,name,slug)")
    .order("created_at", { ascending: false });
  const { data, error } = await scopeQuery(c, query);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.post("/team", requireAuth, async (c) => {
  const body = await c.req.json();
  const tenantId = tenantForWrite(c, body);
  if (!tenantId) return c.json({ error: "Tenant obrigatório" }, 400);
  const { data, error } = await supabase
    .from("crm_tenant_users")
    .insert({ tenant_id: tenantId, user_id: body.user_id, role: body.role ?? "seller", active: body.active ?? true })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

// ── Organizations ────────────────────────────────────────────────────────────
protect("/organizations");

app.get("/organizations", async (c) => {
  const { data, error } = await scopeQuery(c, supabase.from("crm_organizations").select("*")).order("name");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.get("/organizations/:id", async (c) => {
  const { data, error } = await scopeQuery(
    c,
    supabase.from("crm_organizations").select("*, crm_contacts(*), crm_opportunities(*, crm_stages(*))")
  ).eq("id", c.req.param("id")).single();
  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});

app.post("/organizations", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("crm_organizations")
    .insert({ ...body, tenant_id: tenantForWrite(c, body), owner_id: c.get("userId") })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.put("/organizations/:id", async (c) => {
  const body = await c.req.json();
  const { data, error } = await scopeQuery(
    c,
    supabase.from("crm_organizations").update({ ...body, updated_at: new Date().toISOString() })
  )
    .eq("id", c.req.param("id"))
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.delete("/organizations/:id", async (c) => {
  const { error } = await scopeQuery(c, supabase.from("crm_organizations").delete()).eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

// ── Contacts ─────────────────────────────────────────────────────────────────
protect("/organizations/:orgId/contacts");
protect("/contacts");

app.get("/organizations/:orgId/contacts", async (c) => {
  const { data, error } = await scopeQuery(c, supabase.from("crm_contacts").select("*"))
    .eq("organization_id", c.req.param("orgId"))
    .order("name");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.post("/organizations/:orgId/contacts", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("crm_contacts")
    .insert({ ...body, tenant_id: tenantForWrite(c, body), organization_id: c.req.param("orgId") })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.put("/contacts/:id", async (c) => {
  const { data, error } = await scopeQuery(c, supabase.from("crm_contacts").update(await c.req.json()))
    .eq("id", c.req.param("id"))
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.delete("/contacts/:id", async (c) => {
  const { error } = await scopeQuery(c, supabase.from("crm_contacts").delete()).eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

// ── Opportunities ────────────────────────────────────────────────────────────
protect("/opportunities");

app.get("/opportunities", async (c) => {
  const { data, error } = await scopeQuery(
    c,
    supabase.from("crm_opportunities").select("*, crm_stages(*), crm_organizations(id,name), crm_contacts(id,name,phone,email)")
  ).order("updated_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.get("/opportunities/:id", async (c) => {
  const { data, error } = await scopeQuery(
    c,
    supabase.from("crm_opportunities").select("*, crm_stages(*), crm_organizations(*), crm_contacts(*), crm_activities(*), crm_tasks(*)")
  ).eq("id", c.req.param("id")).single();
  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});

app.post("/opportunities", async (c) => {
  const body = await c.req.json();
  const tenantId = tenantForWrite(c, body);
  if (!body.stage_id) body.stage_id = await firstStageForTenant(tenantId);
  const { data, error } = await supabase
    .from("crm_opportunities")
    .insert({ ...body, tenant_id: tenantId, owner_id: body.owner_id ?? c.get("userId") })
    .select("*, crm_stages(*), crm_organizations(id,name)")
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.put("/opportunities/:id", async (c) => {
  const body = await c.req.json();
  const { data, error } = await scopeQuery(
    c,
    supabase.from("crm_opportunities").update({ ...body, updated_at: new Date().toISOString() })
  )
    .eq("id", c.req.param("id"))
    .select("*, crm_stages(*), crm_organizations(id,name)")
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.delete("/opportunities/:id", async (c) => {
  const { error } = await scopeQuery(c, supabase.from("crm_opportunities").delete()).eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

// ── Activities and tasks ─────────────────────────────────────────────────────
protect("/activities");
protect("/tasks");

app.post("/activities", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("crm_activities")
    .insert({ ...body, tenant_id: tenantForWrite(c, body), user_id: c.get("userId") })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.delete("/activities/:id", async (c) => {
  const { error } = await scopeQuery(c, supabase.from("crm_activities").delete()).eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

app.get("/tasks", async (c) => {
  let query = scopeQuery(c, supabase.from("crm_tasks").select("*, crm_organizations(id,name), crm_opportunities(id,title)"));
  const ctx = auth(c);
  if (ctx.role === "seller" && !ctx.isSuperAdmin) query = query.eq("assigned_to", ctx.userId);
  const { data, error } = await query.order("due_date");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.post("/tasks", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase
    .from("crm_tasks")
    .insert({ ...body, tenant_id: tenantForWrite(c, body), assigned_to: body.assigned_to ?? c.get("userId") })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.put("/tasks/:id", async (c) => {
  const body = await c.req.json();
  if (body.completed && !body.completed_at) body.completed_at = new Date().toISOString();
  const { data, error } = await scopeQuery(c, supabase.from("crm_tasks").update(body))
    .eq("id", c.req.param("id"))
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.delete("/tasks/:id", async (c) => {
  const { error } = await scopeQuery(c, supabase.from("crm_tasks").delete()).eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

// ── Settings / integrations / files / logs ───────────────────────────────────
protect("/settings");
protect("/files");
protect("/ingestion-logs");

app.get("/settings/stages", async (c) => {
  const { data, error } = await scopeQuery(c, supabase.from("crm_stages").select("*")).order("position");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.post("/settings/stages", async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("crm_stages").insert({ ...body, tenant_id: tenantForWrite(c, body) }).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.delete("/settings/stages/:id", async (c) => {
  const { error } = await scopeQuery(c, supabase.from("crm_stages").delete()).eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

app.get("/integrations", requireAuth, async (c) => {
  const { data, error } = await scopeQuery(c, supabase.from("crm_integrations").select("*")).order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.post("/integrations", requireAuth, async (c) => {
  const body = await c.req.json();
  const { data, error } = await supabase.from("crm_integrations").insert({ ...body, tenant_id: tenantForWrite(c, body) }).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.get("/files", async (c) => {
  const { data, error } = await scopeQuery(c, supabase.from("crm_files").select("*")).order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

app.get("/ingestion-logs", async (c) => {
  const { data, error } = await scopeQuery(c, supabase.from("crm_ingestion_logs").select("*")).order("created_at", { ascending: false }).limit(100);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? []);
});

// ── Public ingestion ─────────────────────────────────────────────────────────
app.post("/public/leads", async (c) => {
  const key = await resolveIngestionKey(c);
  if (!key) return c.json({ error: "Chave de ingestão inválida" }, 401);
  const body = await c.req.json();
  const result = await createLead(key.tenant_id, body, (body.source ?? "site_form") as LeadSource);
  if ("error" in result) return c.json({ error: result.error }, result.status as any);
  return c.json(result, result.duplicate ? 200 : 201);
});

app.post("/public/leads/files", async (c) => {
  const key = await resolveIngestionKey(c);
  if (!key) return c.json({ error: "Chave de ingestão inválida" }, 401);
  const body = await c.req.json();
  const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(body.mime_type)) {
    await logIngestion({ tenant_id: key.tenant_id, source: body.source ?? "site_form", status: "rejected", message: "Tipo de arquivo não permitido", payload: body });
    return c.json({ error: "Tipo de arquivo não permitido" }, 400);
  }
  if (Number(body.file_size ?? 0) > 10 * 1024 * 1024) {
    await logIngestion({ tenant_id: key.tenant_id, source: body.source ?? "site_form", status: "rejected", message: "Arquivo maior que 10MB", payload: body });
    return c.json({ error: "Arquivo maior que 10MB" }, 400);
  }
  const { data, error } = await supabase.from("crm_files").insert({ ...body, tenant_id: key.tenant_id }).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data, 201);
});

app.post("/integrations/meta/webhook", async (c) => {
  const body = await c.req.json();
  const formId = body.form_id ?? body.formId ?? body.entry?.[0]?.changes?.[0]?.value?.form_id;
  const pageId = body.page_id ?? body.pageId ?? body.entry?.[0]?.id;
  const { data: integrations } = await supabase.from("crm_integrations").select("*").eq("type", "meta").eq("status", "active");
  const integration = integrations?.find((item: any) => item.config?.form_id === formId || item.config?.page_id === pageId);
  if (!integration) return c.json({ error: "Integração Meta não mapeada" }, 404);
  const result = await createLead(integration.tenant_id, body, "meta_lead_ads", integration.id);
  if ("error" in result) return c.json({ error: result.error }, result.status as any);
  await supabase.from("crm_integrations").update({ last_event_at: new Date().toISOString() }).eq("id", integration.id);
  return c.json(result, result.duplicate ? 200 : 201);
});

app.post("/integrations/whatsapp/webhook", async (c) => {
  const body = await c.req.json();
  const phoneNumberId = body.phone_number_id ?? body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  const { data: integrations } = await supabase.from("crm_integrations").select("*").eq("type", "whatsapp").eq("status", "active");
  const integration = integrations?.find((item: any) => item.config?.phone_number_id === phoneNumberId);
  if (!integration) return c.json({ error: "Integração WhatsApp não mapeada" }, 404);
  const result = await createLead(integration.tenant_id, body, "whatsapp_click", integration.id);
  if ("error" in result) return c.json({ error: result.error }, result.status as any);
  await supabase.from("crm_integrations").update({ last_event_at: new Date().toISOString() }).eq("id", integration.id);
  return c.json(result, result.duplicate ? 200 : 201);
});

app.get("/health", (c) => c.json({ status: "ok", service: "crm-server", multi_tenant: true }));

Deno.serve(app.fetch);
