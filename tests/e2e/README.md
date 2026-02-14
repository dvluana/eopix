# 🧪 Testes E2E - E o Pix?

Testes End-to-End para validação pré-produção do sistema E o Pix?.

---

## 📋 Suites de Testes

### `smoke-validations.spec.ts` (PRINCIPAL)
**10 testes de validação crítica**

Valida funcionalidades essenciais do sistema:
- Homepage e formulário de busca
- Validações de CPF/CNPJ
- Páginas admin (compras, blocklist)
- Health check e integrações
- Autenticação (formulários)
- Analytics (Plausible)
- Navegação

**Status**: ✅ 10/10 passando

---

### `critical-journeys.spec.ts` (PLANEJADO)
**8 jornadas de usuário end-to-end**

Jornadas planejadas (não finalizadas):
1. Autenticação via Magic Code
2. Compra CPF - Fluxo Completo
3. Compra CNPJ - Fluxo Completo
4. Admin - Gerenciar Compras
5. Admin - Gerenciar Blocklist
6. Analytics - Eventos Plausible
7. Email de Conclusão
8. Validação de Documentos

**Nota**: Requer dados seed ou ambiente de staging para execução completa.

---

## 🚀 Como Executar

### Pré-requisitos
1. Servidor dev rodando ou configurar webServer no Playwright
2. TEST_MODE=true configurado
3. Banco de dados acessível

### Comandos

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar apenas smoke validations
npx playwright test smoke-validations

# Executar com interface visual (debug)
npm run test:e2e:ui

# Executar com browser visível
npm run test:e2e:headed

# Ver relatório HTML
npx playwright show-report
```

---

## 🔧 Configuração

### Ambiente
O arquivo `.env.local` deve ter:

```bash
TEST_MODE=true
MOCK_MODE=false  # ou true, conforme necessário
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Playwright
Configuração em `playwright.config.ts`:
- Testes sequenciais (não paralelos)
- Timeout: 60s por teste
- Browser: Chromium
- Screenshots em falhas
- Vídeos em falhas

---

## 📊 Resultados

### Última Execução
- **Data**: 2026-02-13
- **Testes**: 10
- **Passados**: 10 (100%)
- **Falhados**: 0
- **Duração**: 21.4s

### Cobertura
- ✅ Homepage e busca
- ✅ Validações (CPF/CNPJ)
- ✅ Admin (compras, blocklist)
- ✅ APIs (health check)
- ✅ Autenticação (formulários)
- ✅ Analytics (Plausible)
- ✅ Navegação

---

## 🐛 Debugging

### Testes Falhando?

1. **Verificar servidor rodando**
   ```bash
   curl http://localhost:3000
   ```

2. **Verificar TEST_MODE ativo**
   ```bash
   cat .env.local | grep TEST_MODE
   ```

3. **Executar em modo headed (browser visível)**
   ```bash
   npm run test:e2e:headed
   ```

4. **Ver screenshot da falha**
   ```bash
   open test-results/**/test-failed-1.png
   ```

5. **Ver vídeo da falha**
   ```bash
   open test-results/**/video.webm
   ```

---

## 📝 Escrevendo Novos Testes

### Template Básico

```typescript
import { test, expect } from '@playwright/test';

test('Descrição do teste', async ({ page }) => {
  // 1. Navegar
  await page.goto('/sua-pagina');

  // 2. Interagir
  const button = page.getByRole('button', { name: /texto/i });
  await button.click();

  // 3. Validar
  await expect(page).toHaveURL(/resultado/);
  const text = await page.textContent('body');
  expect(text).toContain('esperado');
});
```

### Boas Práticas

- ✅ Use seletores semânticos (`getByRole`, `getByText`)
- ✅ Aguarde elementos (`waitForSelector`, `waitForLoadState`)
- ✅ Valide resultados (`expect`)
- ✅ Use `console.log()` para debug
- ❌ Evite sleeps fixos (use `waitFor*` ao invés)
- ❌ Evite seletores CSS frágeis (`.class-123`)

---

## 🔍 Troubleshooting

### "Timeout waiting for element"
- Elemento pode não existir
- Página pode estar carregando
- Seletor pode estar incorreto

**Solução**: Use `{ timeout: 15000 }` ou verifique seletor

### "Port already in use"
- Servidor já rodando em outra instância

**Solução**: Pare processos em `lsof -ti:3000 | xargs kill`

### "Test failed with exit code 1"
- Erro durante execução do teste

**Solução**: Veja screenshot/vídeo em `test-results/`

---

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Relatório E2E](../../RELATORIO-E2E.md)
- [Checklist Pré-Deploy](../../CHECKLIST-PRE-DEPLOY.md)

---

## ✅ Checklist Pré-Execução

- [ ] Servidor dev rodando (`npm run dev`)
- [ ] TEST_MODE=true configurado
- [ ] Database acessível
- [ ] Nenhum erro no build
- [ ] Testes unitários passando

---

**Última atualização**: 2026-02-13
**Versão**: v1.1.0
