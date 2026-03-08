# APIFull — Contratos de API (EOPIX)

> Fonte oficial de documentação de APIs externas usadas no EOPIX.
> Última revisão: 08/03/2026.
> Postman oficial: https://www.postman.com/api-full/api-full/collection/29rpdvv/api-full

## Regras De Governança

- Este arquivo e seus sibling são a fonte de verdade para contratos de API.
- Postman é artefato auxiliar (não canônico).
- Toda mudança de endpoint/payload/parse deve ser atualizada aqui no mesmo commit.

## Status No EOPIX (Código Atual)

| Tipo | Endpoints Utilizados |
|------|---|
| **CPF** | `ic-cpf-completo` + `r-acoes-e-processos-judiciais` + `srs-premium` |
| **CNPJ** | `ic-dossie-juridico` + `srs-premium` |

## Visão Geral dos Endpoints

| Endpoint | URL Path | Link (body) | Parâmetro | Arquivo |
|----------|----------|-------------|-----------|---------|
| CPF Completo | `/api/ic-cpf-completo` | `ic-cpf-completo` | `cpf` | `cpf-cadastral.md` |
| Ações e Processos | `/api/r-acoes-e-processos-judiciais` | `r-acoes-e-processos-judiciais` | `cpf` | `cpf-processos.md` |
| Dossiê Jurídico | `/api/ic-dossie-juridico` | `ic-dossie-juridico` | `document` | `cnpj-dossie.md` |
| Serasa Premium (CPF/CNPJ) | `/api/srs-premium` | `srs-premium` | `document` | `cpf-financeiro.md` / `cnpj-financeiro.md` |

**ATENÇÃO:** `r-cpf-completo` NÃO deve ser usado — créditos separados que esgotam. Usar `ic-cpf-completo`.

## Notas de Uso

### URL Base e Headers Obrigatórios

```
Base: https://api.apifull.com.br
```

**IMPORTANTE:** O servidor Apache da APIFull bloqueia requests sem `User-Agent` (retorna 403 Forbidden). Sempre incluir um User-Agent válido.

### Exemplo de Request

```javascript
const response = await fetch('https://api.apifull.com.br/api/ic-cpf-completo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {{token}}',
    'User-Agent': 'EOPIX/1.0'
  },
  body: JSON.stringify({
    cpf: '12345678900',
    link: 'ic-cpf-completo'
  })
});
```

### Status de Retorno

| Status | Significado |
|--------|-------------|
| `"sucesso"` | Consulta realizada com sucesso |
| `statusRetorno: 1` | Dados encontrados |
| `statusRetorno: 0` | Sem dados para o documento |

### Tipos de Dados Comuns

| Tipo | Formato | Exemplo |
|------|---------|---------|
| CPF | 11 dígitos | `"12345678900"` |
| CNPJ | 14 dígitos | `"12345678000199"` |
| Data | DD/MM/YYYY | `"25/02/1981"` |
| DateTime | YYYY-MM-DD HH:mm:ss | `"2025-01-15 00:00:00"` |
| Moeda | String | `"R$"` |
| Valor | Number ou String | `9505.24` ou `"4305"` |
