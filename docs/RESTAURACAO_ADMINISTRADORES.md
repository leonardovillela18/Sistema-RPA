> Documento da versão anterior. Para a nova proposta autorizada de operador/admin e troca de senha, consulte [OPERADORES_E_SENHAS.md](OPERADORES_E_SENHAS.md). Nenhum SQL ou deploy foi executado.

# Restauração do gerenciamento de administradores sem alteração de banco

## Resultado

Restaurado o comportamento compatível com o commit f9835cb e o schema existente de produção. Todos os registros autenticados da tabela admins têm os mesmos privilégios. Nenhuma mudança de banco é necessária. Não houve deploy, conexão com MySQL, execução de SQL, mudança de credenciais ou migração.

## Causa corrigida e dependências removidas

A implementação posterior exigia estruturas não presentes no banco. A restauração foi coordenada entre autenticação, gerenciamento, conteúdo, interface, schema de instalação e documentação:

- role: removidos campo no schema local, SELECT/INSERT/UPDATE, validações, verificações de permissão, escolha/exibição de perfil, funções de superadmin e atribuição especial no script privado.
- must_change_password: removidos campo no schema, leitura/gravação, checkbox, desvio de navegação, bloqueio administrativo e página/endpoint de troca obrigatória.
- session_version: removidos campo no schema, consultas, gravações, comparação com sessão PHP e incrementos ao trocar senha.
- audit_log: removidos definição no schema, INSERT/SELECT, função de gravação, endpoint de consulta, interface de histórico e chamadas nas alterações de contas, produtos, contatos e Sobre nós.
- 002_superadmin_password_audit.sql: arquivo excluído. Não executar nem recuperar essa migração para publicar esta correção. Não existe migração substituta ou tabela auxiliar.
- O tratamento genérico que convertia os erros MySQL 1054/1146 em mensagem de banco pendente foi removido após eliminar as consultas incompatíveis. Exceções reais continuam registradas no log PHP, com resposta genérica ao cliente e sem expor credenciais.

A autenticação agora consulta id/password_hash no login, usa password_verify, regenera o ID de sessão e grava admin_id. A consulta de sessão lê apenas id/name/login/email por esse identificador. Sem login, me.php retorna user null e CSRF. Logout encerra a sessão. Todas as alterações administrativas continuam exigindo sessão e CSRF.

## Arquivos modificados e excluídos

Restaurados: public/api/bootstrap.php; public/api/auth/login.php; os seis arquivos de public/api/admin/users/; public/api/admin/products/save.php e delete.php; public/api/admin/contacts/save.php; public/api/admin/about/save.php; private/create-admin.php; public/usuarios.html; public/assets/js/site-auth.js, usuarios.js e api.js; public/assets/css/usuarios.css; database/schema.sql; README.md e README_DEPLOY.md.

Removido também um atributo de apresentação sem uso em site-auth.js e a classe de perfil sem uso em public/assets/css/navbar-login.css. Os atributos HTML de acessibilidade foram preservados.

Excluídos: public/alterar-senha.html; public/assets/js/alterar-senha.js; public/api/auth/change-password.php (a troca obrigatória, não a alteração de senha na gestão); public/api/password.php (a validação volta ao helper de administradores); public/api/admin/audit/list.php; a migração mencionada; docs/SUPERADMIN_SENHAS_AUDITORIA.md e tests/admin-security.cjs, específicos dos recursos retirados.

Atualizados os documentos de testes e o diagnóstico anterior, removendo a proposta de SQL/tabelas auxiliares. public/api/auth/me.php, logout.php e public/assets/js/acesso.js foram revisados e validados: já usam o contrato restaurado e não precisaram de alteração.

## Verificação do contrato de banco

Todas as consultas de admins voltaram a usar exclusivamente id, name, login, email, password_hash, created_at e updated_at, conforme o schema anterior. O schema local foi restaurado como arquivo de referência para instalações novas; NÃO foi importado. As consultas das páginas de conteúdo voltaram às mesmas da versão compatível, sem dependência de histórico.

## Testes executados nesta correção

Para cumprir a proibição de executar SQL, os testes HTTP usaram uma cópia temporária do código e um substituto de PDO que responde com fixtures contendo apenas os campos antigos. Nenhuma conexão foi aberta e nenhum comando foi enviado a um banco. Esse substituto existe somente na pasta temporária de teste e não foi introduzido no código publicável. Senhas e sessões foram processadas pelo PHP real; os dados de teste ficaram em arquivo JSON temporário.

Passaram 41 verificações HTTP com o substituto de PDO:

- snapshot público; me.php sem sessão; login correto/incorreto; me.php autenticado; logout e novo login;
- APIs de administradores negadas a visitantes;
- listagem, criação e login do administrador recém-criado, inclusive acesso à listagem com os mesmos privilégios;
- duplicidade de login/e-mail e senha curta rejeitadas;
- edição de nome/login/e-mail e atualização na consulta de sessão;
- alteração de senha, rejeição da anterior e login com a nova;
- exclusão da própria conta e do último administrador bloqueadas;
- exclusão de outro administrador e perda de acesso da sessão da conta excluída;
- rejeição de CSRF ausente nas quatro mutações de administradores;
- retornos de sessão/listagem sem hash de senha e sem respostas inesperadas 500/503.

As sete páginas HTML públicas retornaram HTTP 200 na cópia de teste. PHP e JavaScript passaram na verificação de sintaxe. A busca global deixou os termos retirados somente neste relatório; role também aparece nos atributos legítimos de acessibilidade e como parte da palavra controles, sem representar permissão ou coluna.

Limites: não foi executado teste de integração com MySQL real, pois isso exigiria executar SQL e modificar dados durante criação/edição/exclusão. O simulador não valida locks concorrentes, índices reais, comportamento PDO/MySQL nem gravações de conteúdo no banco. As consultas de conteúdo foram revisadas e comparadas com a implementação anterior. Também não houve inspeção visual no navegador. Essas limitações não são apresentadas como testes reais de banco aprovados.

## Configuração e publicação futura

Preservado literalmente o caminho /home1/rpamec18/private/config.php com a alternativa getenv('RPA_CONFIG'). Nenhuma credencial foi alterada ou incorporada ao repositório.

Nenhuma ação SQL é necessária na HostGator. Quando a publicação for autorizada em outro momento, sincronizar o conteúdo de public/ incluindo a remoção dos arquivos obsoletos listados acima; copiar somente arquivos novos não remove os endpoints antigos. Não publicar a pasta temporária de testes. Nesta tarefa não houve deploy.
