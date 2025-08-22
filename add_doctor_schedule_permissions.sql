-- Script para adicionar permissões de agenda do médico
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Inserir as novas permissões
INSERT INTO permissions (id, name, description, resource, action, is_active, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), 'doctor_schedule_view', 'Visualizar agenda pessoal do médico', 'doctor_schedule', 'view', true, NOW(), NOW()),
  (gen_random_uuid(), 'doctor_schedule_manage', 'Gerenciar agenda pessoal do médico', 'doctor_schedule', 'manage', true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. Adicionar permissões ao role DOCTOR
INSERT INTO role_permissions (id, role, permission_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'DOCTOR',
  p.id,
  NOW(),
  NOW()
FROM permissions p 
WHERE p.name IN ('doctor_schedule_view', 'doctor_schedule_manage')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 3. Adicionar permissões ao role ADMIN
INSERT INTO role_permissions (id, role, permission_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'ADMIN',
  p.id,
  NOW(),
  NOW()
FROM permissions p 
WHERE p.name IN ('doctor_schedule_view', 'doctor_schedule_manage')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 4. Verificar as permissões criadas
SELECT 
  p.name,
  p.description,
  p.resource,
  p.action,
  p.is_active
FROM permissions p 
WHERE p.name IN ('doctor_schedule_view', 'doctor_schedule_manage');

-- 5. Verificar as permissões atribuídas aos roles
SELECT 
  rp.role,
  p.name as permission_name,
  p.description
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name IN ('doctor_schedule_view', 'doctor_schedule_manage')
ORDER BY rp.role, p.name;
