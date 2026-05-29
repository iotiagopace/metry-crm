-- ─────────────────────────────────────────────────────────────────────────────
-- Metry CRM — Multi-tenant infrastructure
-- Adds tenant isolation, public lead ingestion, files, integrations and logs.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crm_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  default_lead_source TEXT NOT NULL DEFAULT 'site_form',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES crm_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('super_admin','tenant_admin','seller')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS crm_integration_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES crm_tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES crm_tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('site','meta','whatsapp','manual','webhook')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','error')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES crm_tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  source TEXT NOT NULL DEFAULT 'site_form',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES crm_tenants(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES crm_integrations(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('received','created','duplicate','error','rejected')),
  message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
DECLARE
  default_tenant UUID;
  user_record RECORD;
  raw_key TEXT := 'metry_public_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
BEGIN
  INSERT INTO crm_tenants (name, slug, domain, default_lead_source)
  VALUES ('Metry', 'metry', 'crm.metry.cc', 'manual')
  ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO default_tenant;

  IF default_tenant IS NULL THEN
    SELECT id INTO default_tenant FROM crm_tenants WHERE slug = 'metry';
  END IF;

  ALTER TABLE crm_stages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES crm_tenants(id) ON DELETE CASCADE;
  ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES crm_tenants(id) ON DELETE CASCADE;
  ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES crm_tenants(id) ON DELETE CASCADE;
  ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES crm_tenants(id) ON DELETE CASCADE;
  ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES crm_tenants(id) ON DELETE CASCADE;
  ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES crm_tenants(id) ON DELETE CASCADE;

  UPDATE crm_stages SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE crm_organizations SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE crm_contacts SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE crm_opportunities SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE crm_activities SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE crm_tasks SET tenant_id = default_tenant WHERE tenant_id IS NULL;

  ALTER TABLE crm_stages ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE crm_organizations ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE crm_contacts ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE crm_opportunities ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE crm_activities ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE crm_tasks ALTER COLUMN tenant_id SET NOT NULL;

  FOR user_record IN SELECT id, email FROM auth.users LOOP
    INSERT INTO crm_tenant_users (tenant_id, user_id, role, active)
    VALUES (default_tenant, user_record.id, 'tenant_admin', TRUE)
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END LOOP;

  INSERT INTO crm_integration_keys (tenant_id, label, key_prefix, key_hash, allowed_domains)
  SELECT default_tenant, 'Chave pública inicial', left(raw_key, 18), 'bootstrap_' || replace(gen_random_uuid()::text, '-', ''), ARRAY['crm.metry.cc']
  WHERE NOT EXISTS (SELECT 1 FROM crm_integration_keys WHERE tenant_id = default_tenant);

  INSERT INTO crm_integrations (tenant_id, type, name, status, config)
  VALUES
    (default_tenant, 'site', 'Site / formulário padrão', 'active', jsonb_build_object('domains', ARRAY['crm.metry.cc'])),
    (default_tenant, 'manual', 'Cadastro manual', 'active', '{}'::jsonb)
  ON CONFLICT DO NOTHING;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_tenant_users_user ON crm_tenant_users(user_id, active);
CREATE INDEX IF NOT EXISTS idx_crm_integration_keys_tenant ON crm_integration_keys(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_tenant_type ON crm_integrations(tenant_id, type, status);
CREATE INDEX IF NOT EXISTS idx_crm_files_tenant_contact ON crm_files(tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_ingestion_logs_tenant ON crm_ingestion_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_stages_tenant_position ON crm_stages(tenant_id, position);
CREATE INDEX IF NOT EXISTS idx_crm_orgs_tenant_owner ON crm_organizations(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_org ON crm_contacts(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_opps_tenant_stage ON crm_opportunities(tenant_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_tenant_assigned ON crm_tasks(tenant_id, assigned_to, completed, due_date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_stages_tenant_position_unique ON crm_stages(tenant_id, position);

INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-files', 'crm-files', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE crm_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integration_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION crm_user_can_access_tenant(target_tenant UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM crm_tenant_users tu
    WHERE tu.user_id = auth.uid()
      AND tu.active = TRUE
      AND (tu.tenant_id = target_tenant OR tu.role = 'super_admin')
  );
$$;

DROP POLICY IF EXISTS crm_tenants_access ON crm_tenants;
CREATE POLICY crm_tenants_access ON crm_tenants
  FOR ALL USING (crm_user_can_access_tenant(id))
  WITH CHECK (crm_user_can_access_tenant(id));

DROP POLICY IF EXISTS crm_tenant_users_access ON crm_tenant_users;
CREATE POLICY crm_tenant_users_access ON crm_tenant_users
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_integration_keys_access ON crm_integration_keys;
CREATE POLICY crm_integration_keys_access ON crm_integration_keys
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_integrations_access ON crm_integrations;
CREATE POLICY crm_integrations_access ON crm_integrations
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_files_access ON crm_files;
CREATE POLICY crm_files_access ON crm_files
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_ingestion_logs_access ON crm_ingestion_logs;
CREATE POLICY crm_ingestion_logs_access ON crm_ingestion_logs
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_stages_access ON crm_stages;
CREATE POLICY crm_stages_access ON crm_stages
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_organizations_access ON crm_organizations;
CREATE POLICY crm_organizations_access ON crm_organizations
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_contacts_access ON crm_contacts;
CREATE POLICY crm_contacts_access ON crm_contacts
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_opportunities_access ON crm_opportunities;
CREATE POLICY crm_opportunities_access ON crm_opportunities
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_activities_access ON crm_activities;
CREATE POLICY crm_activities_access ON crm_activities
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));

DROP POLICY IF EXISTS crm_tasks_access ON crm_tasks;
CREATE POLICY crm_tasks_access ON crm_tasks
  FOR ALL USING (crm_user_can_access_tenant(tenant_id))
  WITH CHECK (crm_user_can_access_tenant(tenant_id));
