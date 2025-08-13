# Sistema RBAC - AgendaSaúde

## Visão Geral

O sistema RBAC (Role-Based Access Control) implementado permite controlar o acesso a funcionalidades do sistema baseado em **roles** (papéis) e **permissions** (permissões).

## Estrutura

### 1. **Roles (Papéis)**
- **MASTER**: Acesso total ao sistema
- **ADMIN**: Administrador com acesso amplo
- **DOCTOR**: Médico com acesso a consultas e pacientes
- **PATIENT**: Paciente com acesso limitado

### 2. **Permissions (Permissões)**
Organizadas por categorias:
- **Usuários**: `user_create`, `user_read`, `user_update`, `user_delete`, `user_list`
- **Dashboard**: `dashboard_view`, `dashboard_stats`, `dashboard_reports`
- **Agendamentos**: `appointment_create`, `appointment_read`, etc.
- **Pacientes**: `patient_create`, `patient_read`, etc.
- **Médicos**: `doctor_create`, `doctor_read`, etc.
- E muito mais...

## Uso no Backend

### 1. **Proteger Rotas com Decorador**

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Permissions } from './auth/decorators/permissions.decorator';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { PERMISSIONS } from './auth/constants/permissions';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  
  @Get()
  @Permissions(PERMISSIONS.USER_LIST)
  async getUsers() {
    // Só usuários com permissão 'user_list' podem acessar
  }

  @Post()
  @Permissions(PERMISSIONS.USER_CREATE)
  async createUser() {
    // Só usuários com permissão 'user_create' podem acessar
  }

  @Get('admin-only')
  @Permissions(PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE)
  async adminFunction() {
    // Usuário precisa ter AMBAS as permissões
  }
}
```

### 2. **Verificar Permissões Programaticamente**

```typescript
import { RbacService } from './auth/services/rbac.service';

@Injectable()
export class SomeService {
  constructor(private rbacService: RbacService) {}

  async someMethod(userId: string) {
    // Verificar uma permissão
    const canCreate = await this.rbacService.hasPermission(userId, PERMISSIONS.USER_CREATE);
    
    if (canCreate) {
      // Executar ação
    }

    // Verificar múltiplas permissões
    const canManage = await this.rbacService.hasPermissions(userId, [
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE
    ]);
  }
}
```

## Uso no Frontend

### 1. **Hook usePermission**

```typescript
import { usePermission, PERMISSIONS } from '../hooks/usePermission';

function MyComponent() {
  const { hasPermission, hasRole, isAdmin } = usePermission();

  return (
    <div>
      {hasPermission(PERMISSIONS.USER_CREATE) && (
        <button>Criar Usuário</button>
      )}
      
      {isAdmin() && (
        <AdminPanel />
      )}
      
      {hasRole('DOCTOR') && (
        <DoctorFeatures />
      )}
    </div>
  );
}
```

### 2. **Componente de Proteção**

```typescript
import { ProtectedByPermission, ProtectedByRole } from '../components/ProtectedByPermission';
import { PERMISSIONS } from '../hooks/usePermission';

function App() {
  return (
    <div>
      <ProtectedByPermission permissions={PERMISSIONS.USER_CREATE}>
        <CreateUserButton />
      </ProtectedByPermission>
      
      <ProtectedByPermission 
        permissions={[PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE]}
        requireAll={true}
      >
        <UserManagementPanel />
      </ProtectedByPermission>
      
      <ProtectedByRole roles={['ADMIN', 'MASTER']}>
        <AdminSettings />
      </ProtectedByRole>
    </div>
  );
}
```

### 3. **Menu com Permissões**

```typescript
import { PERMISSIONS } from '../hooks/usePermission';

const menuItems = [
  {
    label: 'Usuários',
    path: '/users',
    icon: <UserIcon />,
    permissions: [PERMISSIONS.USER_LIST], // Só exibe se tiver a permissão
    subItems: [
      {
        label: 'Criar Usuário',
        path: '/users/create',
        icon: <PlusIcon />,
        permissions: [PERMISSIONS.USER_CREATE],
      }
    ]
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: <AdminIcon />,
    roles: ['ADMIN', 'MASTER'], // Só exibe para estes roles
  }
];
```

## Comandos Úteis

### 1. **Configuração Inicial**
```bash
# Executar migration para criar tabelas RBAC
npm run db:migrate

# Gerar cliente Prisma
npm run db:generate

# Sincronizar permissões e roles
npm run rbac:sync

# Executar tudo de uma vez
npm run db:setup
```

### 2. **Gerenciar Permissões via API**

```bash
# Sincronizar todo o RBAC
POST /api/rbac/sync

# Ver permissões de um usuário
GET /api/rbac/user/{userId}/permissions

# Conceder permissão específica
POST /api/rbac/user/{userId}/permissions/{permission}/grant

# Revogar permissão específica
POST /api/rbac/user/{userId}/permissions/{permission}/revoke

# Verificar se usuário tem permissão
GET /api/rbac/user/{userId}/permissions/{permission}/check
```

## Fluxo de Trabalho

1. **Backend**: Defina permissões necessárias nos controllers usando `@Permissions()`
2. **Frontend**: Use `usePermission()` para verificar acesso antes de renderizar componentes
3. **Menus**: Configure permissões/roles nos itens de menu para filtrar automaticamente
4. **Sincronização**: Execute `npm run rbac:sync` sempre que adicionar novas permissões

## Personalização

Para adicionar novas permissões:

1. Adicione em `backend/src/modules/auth/constants/permissions.ts`
2. Execute `npm run rbac:sync`
3. Use a nova permissão nos controllers e frontend

O sistema é totalmente flexível e permite tanto controle por role quanto por permissões granulares! 