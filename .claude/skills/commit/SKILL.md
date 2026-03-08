# Commit Changes

Commit estruturado na branch develop com conventional commits.

## Checks
1. Verificar que estamos na branch `develop` — se não, PARAR e avisar
2. Rodar `git status` para ver mudanças
3. Se não houver mudanças, avisar e parar

## Commit
4. Rodar `git diff --staged` e `git diff` para entender as mudanças
5. Propor mensagem no formato conventional commits:
   - `feat:` nova funcionalidade
   - `fix:` bug fix
   - `docs:` documentação
   - `refactor:` refatoração sem mudança de comportamento
   - `test:` testes
   - `chore:` manutenção
6. Mostrar a mensagem proposta e pedir confirmação
7. Fazer `git add` dos arquivos relevantes (NÃO usar `git add -A` — listar arquivos específicos)
8. Commit com a mensagem aprovada
9. Mostrar `git log --oneline -3` para confirmar
