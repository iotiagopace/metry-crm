UPDATE crm_tenant_users
SET role = 'super_admin'
WHERE user_id IN (
  SELECT id
  FROM auth.users
  WHERE lower(email) IN ('io.tiagopace@gmail.com')
);
