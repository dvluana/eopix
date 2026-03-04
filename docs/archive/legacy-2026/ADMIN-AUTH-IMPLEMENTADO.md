# Autenticação Separada para Admin - Implementado

## Resumo

Foi implementado um sistema de autenticação com **email/senha** exclusivo para área administrativa, separado do sistema de Magic Link usado pelos usuários finais.

## O que foi implementado

### 1. Banco de Dados

**Nova tabela `AdminUser`:**
```prisma
model AdminUser {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String?
  role         String   @default("admin")
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 2. Arquivos Criados

- **`/src/lib/admin-auth.ts`**: Funções de autenticação admin
  - `createAdminUser()`: Criar novo admin
  - `verifyAdminCredentials()`: Validar login

- **`/src/app/api/admin/login/route.ts`**: Endpoint de login admin
  - POST com email/senha
  - Retorna cookie de sessão JWT

- **`/src/app/admin/login/page.tsx`**: Página de login do admin
  - Formulário com email/senha
  - Validação client-side
  - Mensagens de erro

- **`/scripts/create-admin.ts`**: Script CLI para criar admins

### 3. Arquivos Modificados

- **`/prisma/schema.prisma`**: Adicionado model AdminUser
- **`/src/lib/auth.ts`**: Atualizado `isAdminEmail()` para verificar na tabela AdminUser
- **`/middleware.ts`**:
  - Permite acesso a `/admin/login` sem autenticação
  - Permite acesso a `/api/admin/login` sem autenticação
  - Redireciona não autenticados para `/admin/login`
- **`/src/app/admin/layout.tsx`**: Logout redireciona para `/admin/login`

### 4. Dependências Instaladas

- `bcryptjs`: Hashing seguro de senhas
- `@types/bcryptjs`: Tipos TypeScript

## Como Usar

### Criar Usuário Admin

Foi criado um admin de teste:
- **Email**: admin@eopix.com
- **Senha**: Admin@123

Para criar novos admins, use SQL diretamente:

```bash
# 1. Gerar hash da senha
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('SuaSenha123', 10).then(hash => console.log(hash));
"

# 2. Inserir no banco
npx prisma db execute --stdin << 'EOF'
INSERT INTO "AdminUser" (id, email, "passwordHash", name, role, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'novo@admin.com',
  '$2b$10$...hash_aqui...',
  'Nome do Admin',
  'admin',
  true,
  NOW(),
  NOW()
);
EOF
```

### Fazer Login

1. Acesse `http://localhost:3000/admin/login`
2. Digite email e senha
3. Clique em "Entrar"
4. Será redirecionado para `/admin` (dashboard)

### Logout

- Clique no botão "Sair" na sidebar
- Será redirecionado para `/admin/login`

## Segurança

✅ **Senhas hasheadas**: bcrypt com 10 rounds
✅ **Cookies HttpOnly**: Sessão inacessível via JavaScript
✅ **Validação mínima**: 8 caracteres para senha
✅ **Rate limiting**: 100 req/min para /admin (já existia)
✅ **SameSite Lax**: Proteção CSRF
✅ **Campo active**: Permite desativar admin

## Testes Realizados

✅ Login com credenciais corretas (200 + cookie)
✅ Login com credenciais erradas (401)
✅ Acesso a API protegida com cookie válido (200)
✅ Acesso a API protegida sem cookie (401)
✅ Logout limpa cookie corretamente
✅ Página /admin/login acessível sem autenticação

## Compatibilidade

✅ Sistema de Magic Link continua funcionando normalmente
✅ Reutiliza infraestrutura JWT existente (mesmo cookie `eopix_session`)
✅ Não afeta fluxo de usuários finais em `/minhas-consultas`

## Próximos Passos (Opcional)

- [ ] Implementar reset de senha via email
- [ ] Adicionar 2FA (TOTP)
- [ ] Logs de auditoria (login/logout)
- [ ] Sistema de roles (admin, superadmin)
- [ ] Bloquear após N tentativas falhas
- [ ] Melhorar script create-admin.ts com ws support

## Estrutura de Autenticação

```
┌─────────────────────────────────────────┐
│         Usuários Finais                 │
│   /minhas-consultas                     │
│   Magic Link (email + 6 dígitos)        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Administradores                 │
│   /admin/login                          │
│   Email/Senha + AdminUser table         │
└─────────────────────────────────────────┘

        Ambos usam o mesmo JWT
        Cookie: eopix_session (30 dias)
```
