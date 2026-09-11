> Documento da versão anterior. Para a nova proposta autorizada de operador/admin e troca de senha, consulte [OPERADORES_E_SENHAS.md](OPERADORES_E_SENHAS.md). Nenhum SQL ou deploy foi executado.

> Para os resultados e limites da correção atual, veja [RESTAURACAO_ADMINISTRADORES.md](RESTAURACAO_ADMINISTRADORES.md).

# Gerenciamento de administradores

## Instalação e configuração

Não há alteração de banco: a tabela `admins` existente já possui os campos e índices UNIQUE de login/e-mail necessários. Não reimporte `database/schema.sql` em produção. Ele continua sendo destinado apenas à primeira instalação.

O bootstrap continua lendo `/home1/rpamec18/private/config.php`, ou o caminho explicitamente informado por `RPA_CONFIG` no ambiente local. O script `private/create-admin.php` agora usa o mesmo caminho. Nenhuma credencial foi incluída no repositório.

Não é necessário ativar módulos adicionais no cPanel além dos já exigidos pela aplicação PHP/MySQL. Quando for publicar, inclua a página, CSS, JavaScript, APIs novas e arquivos compartilhados modificados. Nenhum deploy foi executado nesta alteração.

## Como funciona

- `/usuarios.html` verifica a sessão existente antes de revelar a interface e consulta a lista por API autenticada. Visitantes são redirecionados para `/acesso.html?next=usuarios.html`; após login, retornam à área. O arquivo HTML é uma estrutura estática sem dados de contas; os dados só são enviados pelas APIs protegidas.
- `GET /api/admin/users/list.php` retorna ID, nome, login, e-mail e datas, sem hashes.
- Os endpoints `create.php`, `update.php`, `change-password.php` e `delete.php` aceitam somente POST autenticado com CSRF.
- As permissões vêm da sessão PHP. O ID do payload apenas identifica a conta alvo e é validado no servidor.
- A exclusão bloqueia a própria conta e o último administrador. Uma transação bloqueia os registros durante a verificação para proteger exclusões simultâneas.
- Senhas exigem 12 caracteres ou mais, até 72 bytes, e confirmação igual. Espaços são preservados. A edição de perfil não altera senha.
- Qualquer administrador pode gerenciar as demais contas, inclusive alterar suas senhas. Não há níveis de permissão. Todas as contas autenticadas de admins são administradores.

## Testes manuais

1. Sem login, abra `/usuarios.html`: deve redirecionar para o acesso. Confirme também que a API de listagem retorna HTTP 401.
2. Faça login com uma conta existente. Abra **Administradores** no cabeçalho: confira as colunas, a marca **Você**, o botão Excluir desabilitado na conta atual e a tabela em largura de celular.
3. Clique em **Novo administrador**, preencha e salve. Confira a nova linha após recarregar a página.
4. Tente criar contas com nome/login vazios, e-mail inválido, login/e-mail repetidos, senha com menos de 12 caracteres, acima de 72 bytes ou confirmação diferente. Cada caso deve mostrar mensagem amigável sem salvar.
5. Edite nome, login e e-mail. Manter o próprio login/e-mail deve funcionar; usar os de outra conta deve falhar. Confirme que a senha anterior continua funcionando.
6. Use **Alterar senha** e confirme o login com a senha nova. Teste uma senha com espaços e outra com letras acentuadas. A senha antiga deve falhar após a troca.
7. Exclua outra conta e confirme a remoção. Cancele uma confirmação para verificar que nada é excluído.
8. Tente, por requisição direta, excluir a própria conta e o último administrador: ambos devem ser bloqueados, independentemente do botão desabilitado.
9. Reenvie cada POST sem `X-CSRF-Token`: espere 403. Sem cookie de sessão, espere 401. Teste métodos incorretos: espere 405.
10. Saia ou deixe a sessão expirar. Uma nova operação na tela deve redirecionar ao login. A sessão de uma conta excluída também perde acesso nas consultas seguintes.
11. Confirme que Início, Serviços, Produtos, Contato e Sobre Nós continuam funcionando, inclusive as edições administrativas existentes.
12. Confira que nenhum retorno inclui senha/hash ou detalhes de PDO, que o snapshot público não inclui administradores e que nenhuma informação de autenticação é gravada em localStorage.

Use contas e banco de teste para testar exclusões e trocas de senha. Nunca execute esses casos automaticamente contra o banco de produção.

## Validação histórica — não executada nesta correção

Testado localmente em PHP 8.2.12 e MariaDB 10.4.32, com banco isolado: listagem, criação, edição, troca de senha com novo login, duplicidades, limites de senha, Unicode, espaços, confirmação, exclusão, proteção da própria/última conta, rejeição de visitantes em todos os endpoints administrativos, CSRF em todas as novas mutações, perda de acesso da conta excluída, logout e regressão do snapshot/edição de contatos/Sobre Nós. Sintaxe PHP/JavaScript e caminhos locais HTML/CSS também verificados.

A inspeção visual, os cliques nos formulários e o redirecionamento no navegador ainda precisam da validação manual acima: o navegador integrado não estava disponível. Não foi feito deploy nem alteração no banco da hospedagem. Não há dependência nova de Node.js, npm ou serviços persistentes.
