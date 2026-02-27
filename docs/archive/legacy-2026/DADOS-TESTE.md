# E O PIX? - Dados de Teste

> **Documento criado em:** 08/02/2026
> **Objetivo:** Manter registro de CPFs e CNPJs para testes com APIs reais
> **IMPORTANTE:** Este arquivo NÃO deve ser commitado em repositórios públicos

---

## CPFs de Teste (Autorizados)

| Nome/Identificador | CPF            | Perfil Esperado | Observações                    |
| ------------------ | -------------- | --------------- | ------------------------------ |
| Luana (dona)       | 926.151.552-53 | Limpo (Sol)     | CPF da proprietária do sistema |
| Esposa             | 038.916.572-77 | A verificar     | Pessoa física autorizada       |
| Conhecido 1        | 047.999.812-42 | A verificar     | Pessoa física autorizada       |
| Conhecida 2        | 006.780.809-33 | A verificar     | Pessoa física autorizada       |

---

## CNPJs de Teste - Empresas Próprias

| Empresa          | CNPJ               | Perfil Esperado | Observações                |
| ---------------- | ------------------ | --------------- | -------------------------- |
| Empresa da Luana | 38.235.301/0001-77 | Limpo (Sol)     | Empresa própria para teste |

---

## CNPJs de Teste - Empresas Públicas (Cenário Chuva)

### Top Picks para Testes Extremos

#### 1. 123milhas - MELHOR PARA TESTAR TUDO

| Campo           | Valor                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| **CNPJ**        | 21.239.459/0001-21                                                                                             |
| **Situação**    | Recuperação Judicial                                                                                           |
| **O que testa** | TODOS os cards do relatório                                                                                    |
| **Detalhes**    | Milhares de processos, nota péssima no Reclame Aqui, CPI no Congresso, matérias em todos os portais de notícia |

#### 2. Telexfree (Ympactus Comercial S/A) - EMPRESA BAIXADA

| Campo           | Valor                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **CNPJ**        | 11.669.325/0001-88                                                                                 |
| **Situação**    | Baixada (Falência)                                                                                 |
| **O que testa** | Cenário com empresa baixada, alerta visual de borda vermelha no card de cadastro                   |
| **Detalhes**    | Pirâmide financeira, falência decretada, condenação criminal dos sócios, prejuízo de R$ 16 bilhões |

#### 3. Americanas S.A. - EMPRESA ATIVA COM PROBLEMAS

| Campo             | Valor                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **CNPJ (filial)** | 00.776.574/0006-60                                                                                  |
| **CNPJ (matriz)** | 33.014.556/0001-96                                                                                  |
| **Situação**      | Ativa (Recuperação Judicial)                                                                        |
| **O que testa**   | Cenário Chuva com cadastro ativo, volume absurdo de processos e notícias                            |
| **Detalhes**      | Rombo contábil de R$ 40+ bilhões, 13 ex-executivos denunciados pelo MPF, cobertura de mídia massiva |

---

## CNPJs de Teste - Empresas Públicas (Cenário Sol/Neutro)

| Empresa        | CNPJ               | Perfil Esperado | Observações                                |
| -------------- | ------------------ | --------------- | ------------------------------------------ |
| Magazine Luiza | 47.960.950/0001-21 | Misto           | Grande empresa, pode ter processos normais |
| Nubank         | 18.236.120/0001-58 | Limpo           | Fintech moderna, perfil mais "limpo"       |
| Petrobras      | 33.000.167/0001-01 | Misto           | Estatal, muitos processos públicos         |

---

## Sugestão de Ordem de Testes

### Fase 1: Validar Fluxo Básico

1. **CPF Luana (926.151.552-53)** - Testar fluxo completo com cenário limpo
2. **CNPJ Próprio (38.235.301/0001-77)** - Testar fluxo CNPJ com empresa própria

### Fase 2: Validar Cenários Extremos

3. **123milhas (26.669.170/0001-57)** - Testar TODOS os cards com dados problemáticos
4. **Telexfree (11.669.325/0001-88)** - Testar empresa baixada/falida
5. **Americanas (33.014.556/0001-96)** - Testar empresa ativa com muitos problemas

### Fase 3: Validar Outros CPFs

8. **Conhecida 2 (006.780.809-33)** - Verificar outro perfil PF

---

## Resultados dos Testes

### Template de Registro

```
Data: DD/MM/AAAA
CPF/CNPJ: XXX
Ambiente: TEST_MODE=true, MOCK_MODE=false
Resultado: OK / FALHA
Observações: ...
```

### Testes Realizados

| Data       | Documento      | Tipo | Resultado | Observações                                                                   |
| ---------- | -------------- | ---- | --------- | ----------------------------------------------------------------------------- |
| 08/02/2026 | 926.151.552-53 | CPF  | ✅ OK     | Fluxo completo: validação APIFull + purchase PAID + confirmação. Code: 3YHD7E |

---

## Notas Importantes

1. **Privacidade:** Os CPFs listados são de pessoas que autorizaram o uso para testes
2. **Não commitar:** Este arquivo contém dados pessoais - NÃO commitar em repos públicos
3. **APIs Reais:** Todos os testes usam `MOCK_MODE=false` para validar APIs reais
4. **TEST_MODE:** Usa `TEST_MODE=true` para bypass de pagamento e auth (código 123456)

---

**Última atualização:** 08/02/2026
