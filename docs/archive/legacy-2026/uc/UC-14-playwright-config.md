# UC-14: Configurar Playwright (Testes E2E)

## Objetivo
Configurar framework Playwright para execução de testes end-to-end com suporte a múltiplos browsers e mode debug.

## Escopo
**Inclui**:
- Instalação de dependências (@playwright/test)
- Criação de arquivo de configuração `playwright.config.ts`
- Configuração de 3 browsers (chromium, firefox, webkit)
- baseURL para localhost:3000
- Scripts npm para execução de testes
- Retry automático em ambiente CI
- Screenshot/video on failure

**Não inclui**:
- Testes unitários (UC-13)
- Implementação de testes E2E (UC-15)
- Configuração de CI/CD específica

## Atores
- **Desenvolvedor**: Configura e executa testes E2E localmente
- **CI/CD**: Executa testes automaticamente em PRs com retry

## Regras de Negócio
1. **[RN-01]** Testar em 3 browsers: chromium (principal), firefox, webkit
2. **[RN-02]** baseURL configurada para http://localhost:3000
3. **[RN-03]** Retry automático: 2x em CI, 0x em local
4. **[RN-04]** Capturar screenshot/video apenas em falhas
5. **[RN-05]** Executar em modo headless por padrão, permitir headed mode para debug

## Contrato de Configuração

### Arquivo: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Scripts npm (package.json)
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### Dependências
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

## Status Implementação
- **Backend**: `pending` (arquivo: `playwright.config.ts` - a criar)
- **Frontend**: `na`
- **Banco**: `na`

## Dependências
- **depends_on**: Nenhuma
- **blocks**: UC-15 (implementação de testes E2E)

## Paralelização
- **parallel_group**: G1 (pode ser executado em paralelo com UC-13)

## Estratégia Técnica
- **[Criar]** Arquivo `playwright.config.ts` na raiz do projeto
- **[Instalar]** Dependências via `npm install -D @playwright/test`
- **[Instalar]** Browsers via `npx playwright install`
- **[Adicionar]** Scripts no package.json
- **[Criar]** Diretório `tests/e2e` para armazenar specs
- **[Testar]** Criar spec mínimo para validar configuração

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN desenvolvedor instala dependências e browsers
WHEN executa `npm run test:e2e`
THEN Playwright inicia servidor dev automaticamente
AND executa testes em 3 browsers (chromium, firefox, webkit)
AND exibe relatório HTML ao final

GIVEN desenvolvedor deseja debugar teste falhando
WHEN executa `npm run test:e2e:headed`
THEN Playwright abre browsers visíveis
AND permite visualizar execução passo a passo

GIVEN teste falha em CI
WHEN Playwright executa retry
THEN testa novamente até 2x
AND captura screenshot + video da falha
AND gera trace para análise

GIVEN desenvolvedor deseja explorar testes interativamente
WHEN executa `npm run test:e2e:ui`
THEN Playwright UI abre em browser
AND permite executar/debugar testes individualmente
```

## Testes Obrigatórios
- [ ] Smoke test: criar spec mínimo que visita homepage
- [ ] Validar execução em 3 browsers
- [ ] Validar webServer iniciando automaticamente
- [ ] Validar screenshot on failure

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Configuração especificada
- [x] Dependências mapeadas
- [x] Critérios de aceite testáveis

## Checklist DoD
- [ ] Playwright instalado e configurado
- [ ] Browsers instalados (chromium, firefox, webkit)
- [ ] Scripts npm funcionando
- [ ] webServer configurado corretamente
- [ ] Diretório tests/e2e criado
- [ ] Smoke test executando com sucesso
- [ ] Documentação atualizada (este arquivo)
- [ ] Lint + typecheck passando
- [ ] Build sem erros

## Evidências de Conclusão

```bash
# Instalação
npm install -D @playwright/test
npx playwright install

# Smoke test (criar tests/e2e/smoke.spec.ts)
npm run test:e2e
# → Running 3 tests using 3 workers
# → ✓ [chromium] › smoke.spec.ts:3:1 › homepage loads (1s)
# → ✓ [firefox] › smoke.spec.ts:3:1 › homepage loads (1.2s)
# → ✓ [webkit] › smoke.spec.ts:3:1 › homepage loads (1.1s)
# → 3 passed (3s)

# UI mode
npm run test:e2e:ui
# → Playwright UI started at http://localhost:51205/

# Headed mode (debug)
npm run test:e2e:headed
# → [chromium] › smoke.spec.ts:3:1 › homepage loads
# → Browser window opens visibly
```

## Arquivo a Criar
- **Caminho**: `/playwright.config.ts`
- **Diretório**: `/tests/e2e`
- **Commit**: `feat(uc-14): configurar playwright para testes e2e`
- **Deploy**: N/A (dev dependency)
