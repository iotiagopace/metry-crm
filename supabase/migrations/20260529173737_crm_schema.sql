
CREATE TABLE IF NOT EXISTS crm_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  position INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO crm_stages (label, color, position, is_won, is_lost) VALUES
  ('Novo',        '#64748b', 0, FALSE, FALSE),
  ('Contatado',   '#f97316', 1, FALSE, FALSE),
  ('Proposta',    '#8b5cf6', 2, FALSE, FALSE),
  ('Negociação',  '#eab308', 3, FALSE, FALSE),
  ('Ganho',       '#10b981', 4, TRUE,  FALSE),
  ('Perdido',     '#ef4444', 5, FALSE, TRUE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS crm_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  segment TEXT,
  city TEXT,
  state TEXT,
  website TEXT,
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES crm_stages(id) ON DELETE SET NULL,
  value DECIMAL(12,2) DEFAULT 0,
  expected_close DATE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  qualification INTEGER DEFAULT 0 CHECK (qualification BETWEEN 0 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call','email','whatsapp','meeting','note')),
  description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_orgs_owner ON crm_organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_opps_stage ON crm_opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_opps_owner ON crm_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_opps_org ON crm_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opp ON crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned ON crm_tasks(assigned_to, completed, due_date);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON crm_contacts(organization_id);
;
