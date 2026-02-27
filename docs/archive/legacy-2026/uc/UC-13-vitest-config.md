# UC-13: Configurar Vitest (Testes Unitários)

## Objetivo
Configurar framework Vitest para execução de testes unitários com coverage e suporte a TypeScript.

## Escopo
**Inclui**:
- Instalação de dependências (vitest, @vitest/ui, v8 para coverage)
- Criação de arquivo de configuração `vitest.config.ts`
- Scripts npm para execução de testes
- Configuração de coverage mínimo (60%)
- Suporte a path aliases (@/* → src/*)
- Ambiente Node.js para testes

**Não inclui**:
- Testes E2E (UC-14)
- Implementação de testes (UC-15)
- Configuração de CI/CD

## Atores
- **Desenvolvedor**: Configura e executa testes unitários
- **CI/CD**: Executa testes automaticamente em PRs

## Regras de Negócio
1. **[RN-01]** Coverage mínimo: 60% (lines, statements, functions, branches)
2. **[RN-02]** Testes devem usar ambiente Node.js (não browser)
3. **[RN-03]** Suportar importações com path aliases (@/lib/*, @/components/*)
4. **[RN-04]** Executar testes em modo watch durante desenvolvimento
5. **[RN-05]** Gerar relatório de coverage em formato lcov e html

## Contrato de Configuração

### Arquivo: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/',
        '**/*.config.{ts,js}',
        '**/types.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Scripts npm (package.json)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Dependências
```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@vitest/coverage-v8": "^1.2.0"
  }
}
```

## Status Implementação
- **Backend**: `pending` (arquivo: `vitest.config.ts` - a criar)
- **Frontend**: `na`
- **Banco**: `na`

## Dependências
- **depends_on**: Nenhuma
- **blocks**: UC-15 (implementação de testes)

## Paralelização
- **parallel_group**: G1 (pode ser executado em paralelo com UC-14)

## Estratégia Técnica
- **[Criar]** Arquivo `vitest.config.ts` na raiz do projeto
- **[Instalar]** Dependências via `npm install -D vitest @vitest/ui @vitest/coverage-v8`
- **[Adicionar]** Scripts no package.json
- **[Testar]** Criar arquivo de teste mínimo para validar configuração

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN desenvolvedor instala dependências
WHEN executa `npm run test`
THEN Vitest inicia em modo watch
AND aguarda criação de arquivos .test.ts

GIVEN desenvolvedor cria arquivo de teste
WHEN executa `npm run test:coverage`
THEN Vitest executa todos os testes
AND gera relatório de coverage
AND falha se coverage < 60%

GIVEN desenvolvedor usa path alias @/lib/validators
WHEN importa em arquivo de teste
THEN Vitest resolve alias corretamente
AND testes executam sem erros
```

## Testes Obrigatórios
- [ ] Smoke test: criar teste mínimo que sempre passa
- [ ] Validar resolução de path aliases
- [ ] Validar geração de coverage report
- [ ] Validar thresholds de coverage

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Configuração especificada
- [x] Dependências mapeadas
- [x] Critérios de aceite testáveis

## Checklist DoD
- [ ] Vitest instalado e configurado
- [ ] Scripts npm funcionando
- [ ] Coverage report sendo gerado
- [ ] Path aliases resolvidos corretamente
- [ ] Documentação atualizada (este arquivo)
- [ ] Lint + typecheck passando
- [ ] Build sem erros

## Evidências de Conclusão

```bash
# Instalação
npm install -D vitest @vitest/ui @vitest/coverage-v8

# Smoke test (criar tests/smoke.test.ts)
npm run test
# → ✓ tests/smoke.test.ts (1)
# → Test Files  1 passed (1)
# → Tests  1 passed (1)

# Coverage
npm run test:coverage
# → Coverage report generated at coverage/index.html
# → Lines: 65% (threshold: 60%) ✓

# UI mode
npm run test:ui
# → Vitest UI started at http://localhost:51204/__vitest__/
```

## Arquivo a Criar
- **Caminho**: `/vitest.config.ts`
- **Commit**: `feat(uc-13): configurar vitest para testes unitários`
- **Deploy**: N/A (dev dependency)
