> Documento da versão anterior. Para a nova proposta autorizada de operador/admin e troca de senha, consulte [OPERADORES_E_SENHAS.md](OPERADORES_E_SENHAS.md). Nenhum SQL ou deploy foi executado.

# Diagnóstico histórico — correção aplicada sem migração

A versão anterior consultava colunas inexistentes em admins e exigia uma tabela de histórico. A autenticação e as gravações foram restauradas para o schema existente. A proposta anterior de tabelas auxiliares foi descartada; não execute SQL deste histórico ou de versões anteriores.

A correção e as verificações atuais estão documentadas em RESTAURACAO_ADMINISTRADORES.md. Nenhuma alteração de banco é necessária.
