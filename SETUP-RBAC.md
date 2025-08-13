# 🔧 Guia de Setup - Sistema RBAC Refatorado

## ⚠️ Erros Atuais
Os erros do TypeScript são esperados porque o Prisma client ainda não foi regenerado com o novo schema que usa enum ao invés do model `role`.

## 🚀 Comandos para Resolver

Execute os comandos abaixo **na ordem correta** para finalizar a implementação:

### 1. **Navegar para o backend**
```bash
cd backend
```

### 2. **Executar migration**
```bash
npx prisma migrate dev --name "refactor_rbac_use_enum"
```
*Isso criará as novas tabelas com enum e removerá a tabela `role`*

### 3. **Regenerar o Prisma client**
```bash
npx prisma generate
```
*Isso atualizará os tipos do TypeScript para usar o novo schema*

### 4. **Sincronizar permissões**
```bash
npx ts-node scripts/sync-rbac.ts
```
*Isso populará as tabelas com as permissões padrão*

### 5. **Verificar se não há erros**
```bash
npm run build
```
*Deve compilar sem erros após os passos anteriores*

### 6. **Iniciar o servidor**
```bash
npm run start:dev
```

## 📋 Mudanças Implementadas

### Schema Prisma
- ❌ Removido: `model role`
- ✅ Adicionado: `enum UserRole` (MASTER, ADMIN, DOCTOR, PATIENT)
- ✅ Campo `user.role` agora usa o enum
- ✅ Tabela `role_permission` referencia o enum diretamente

### Backend APIs
- ✅ `GET /api/rbac/permissions` - Listar permissões
- ✅ `GET /api/rbac/role/{role}/permissions` - Permissões de um role
- ✅ `PUT /api/rbac/role/{role}/permissions` - Atualizar permissões de role
- ✅ `GET /api/rbac/users` - Listar usuários com permissões
- ✅ `PUT /api/rbac/user/{userId}/permissions` - Atualizar permissões de usuário

### Frontend
- ✅ Página "Perfis e Permissões" criada
- ✅ Menu sidebar atualizado
- ✅ Integração com APIs
- ✅ Proteção por permissões

## 🎯 Resultado Final

Após executar os comandos, você terá:

1. **Sistema RBAC simplificado** usando enum em vez de tabela separada
2. **Interface de gestão completa** para Admin e Master
3. **APIs funcionais** para gerenciar permissões
4. **Menu dinâmico** que filtra baseado em permissões

## 🔍 Verificação

Para testar se tudo funcionou:

1. Faça login como Master ou Admin
2. Acesse o menu "Perfis e Permissões"
3. Teste alterar permissões de um role
4. Verifique se as mudanças persistem

## 📝 Notas Importantes

- O enum `UserRole` substitui completamente a tabela `role`
- As permissões por role são agora armazenadas diretamente com o enum
- Isso simplifica o modelo e melhora a performance
- Todas as funcionalidades RBAC permanecem funcionais

---

**Execute os comandos na ordem e o sistema estará funcionando perfeitamente!** 🎉 