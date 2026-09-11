# Perfis e gerenciamento de usuários

Esta versão amplia a página existente /usuarios.html. A tabela admins armazena ambos os perfis por compatibilidade. Execute database/migrations/001_user_roles.sql uma vez antes de atualizar instalações existentes; para banco novo, importe somente schema.sql.

## Verificações funcionais em banco de teste

1. Entrar como administrador: o destino padrão é /usuarios.html, com link Usuários no cabeçalho.
2. Criar contas nos perfis Usuário e Administrador; confirmar login de ambas.
3. Como usuário comum, confirmar ausência dos controles de edição e do link Usuários. Acessar /usuarios.html redireciona ao início. Todas as APIs /api/admin devem retornar 403, mesmo com CSRF válido.
4. Sem sessão, confirmar HTTP 401 nas APIs administrativas.
5. Editar nome, login, e-mail e perfil de outra conta; promover e rebaixar, verificando a nova permissão na próxima requisição da sessão já aberta.
6. Tentar rebaixar ou excluir a própria conta e o último administrador: esperar 409. Repetir por chamadas diretas à API.
7. Excluir um usuário comum quando existe somente um administrador: deve funcionar.
8. Buscar por nome, login e e-mail; conferir resultado vazio e total. Limpar a busca restaura a lista.
9. Confirmar alteração de senha, rejeição de duplicidades, senha inválida e CSRF ausente conforme o roteiro anterior.
10. Conferir layout no celular e abertura, cancelamento e envio dos três formulários.

## Validação desta alteração

Sintaxe de todos os arquivos PHP e JavaScript verificada localmente. O banco MySQL local recusou a conexão sem credenciais; os testes de integração e a inspeção no navegador não foram executados nesta alteração. A validação da versão anterior em TESTES_ADMINISTRADORES.md não cobre os novos perfis. Nenhum banco de produção foi alterado.
