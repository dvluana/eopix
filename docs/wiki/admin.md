---
title: "Admin Panel"
---

## Acesso

- URL: `/admin`
- Login: `/api/admin/login` (email + senha bcrypt)
- Sessão: cookie `eopix_session` (8h, sameSite: strict)
- Rate limit: 5 tentativas / 15 min por IP

## Endpoints

| Endpoint | Método | O que faz |
|---|---|---|
| `/api/admin/login` | POST | Login admin |
| `/api/admin/purchases` | GET | Listar purchases (search, pagination) |
| `/api/admin/purchases/:id/mark-paid` | POST | Marcar como paga (sem Inngest) |
| `/api/admin/purchases/:id/mark-paid-and-process` | POST | Marcar + disparar Inngest |
| `/api/admin/purchases/:id/process` | POST | Reprocessar |
| `/api/admin/purchases/:id/refund` | POST | Registrar refund |
| `/api/admin/health` | GET | Status serviços + saldos |
| `/api/admin/blocklist` | GET/POST | Gerenciar blocklist |
| `/api/admin/leads` | GET | Listar leads |

## Operações Comuns

**Reprocessar purchase presa:**
1. Login admin
2. Buscar purchase por código
3. Se PAID: usar mark-paid-and-process (com Inngest) ou process (fallback)
4. Se PROCESSING/FAILED: usar process para retentar

**Refund:**
- Via dashboard AbacatePay (sem API de refund)
- Registrar no admin panel para controle interno

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Purchase Flow" icon="cart-shopping" href="/specs/purchase-flow">
    Fluxo de compra detalhado
  </Card>
  <Card title="Auth" icon="lock" href="/specs/auth">
    Sistema de autenticacao
  </Card>
</CardGroup>
