---
title: "Auth"
---

## Métodos

| Método | Rota | Quem usa |
|---|---|---|
| Registro | POST `/api/auth/register` | Novo user (nome+email+senha) |
| Login | POST `/api/auth/login` | User existente (email+senha) |
| Auto-login | POST `/api/auth/auto-login` | Magic code pós-compra |
| Admin login | POST `/api/admin/login` | Admin (email+senha bcrypt) |

## Sessão

- Cookie: `eopix_session` (HMAC-SHA256)
- User session: duração padrão
- Admin session: 8h, `sameSite: strict`
- Verificação: `hmacVerify()` com `crypto.subtle.verify()` (constant-time)

## Fluxo de Compra + Auth

1. User não logado em `/consulta/[term]`:
   - Mostra form registro (nome/email/senha) + botão compra
   - 1-clique: registra + cria purchase
2. User logado:
   - Mostra só botão compra (sem campos extras)
   - Backend resolve dados do perfil (cellphone, taxId da última compra)
3. Pós-pagamento:
   - Auto-login via magic code (cookie setado automaticamente)
   - Redirect para `/confirmacao` → `/minhas-consultas`

## Segurança

- Senhas: bcrypt hash
- JWT: HMAC-SHA256 (constant-time verify)
- Admin rate limit: 5 tentativas / 15 min por IP
- CSRF: `sameSite: strict` em rotas admin
- Flash prevention: `isAuthenticated` tri-state (null→spinner, false→form, true→lista)

## Arquivos

- Auth lib: `src/lib/auth.ts`
- Register: `src/app/api/auth/register/route.ts`
- Login: `src/app/api/auth/login/route.ts`
- Auto-login: `src/app/api/auth/auto-login/route.ts`
- Admin login: `src/app/api/admin/login/route.ts`

## Docs Relacionados

<CardGroup cols={2}>
  <Card title="Admin Panel" icon="shield" href="/wiki/admin">
    Admin auth e endpoints
  </Card>
  <Card title="Purchase Flow" icon="cart-shopping" href="/specs/purchase-flow">
    Fluxo que usa auth
  </Card>
</CardGroup>
