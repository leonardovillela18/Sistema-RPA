# Operadores, admins e troca obrigatória de senha

## Escopo autorizado

Código e SQL preparados para revisão. Nenhum SQL foi executado, nenhum banco alterado, nenhum deploy feito. Permanecem PHP/MySQL e arquivos estáticos; Node é somente um cliente de testes local.

## Fluxo

- Na criação e edição, escolha Função no site: Operador ou Admin. Novo cadastro começa selecionado como Operador.
- Operadores editam produtos, contatos e Sobre nós. Admins também listam, criam, editam e excluem usuários e redefinem senhas. As APIs verificam a permissão no servidor em cada requisição.
- Cadastro SEMPRE exige troca de senha. A ação Alterar senha SEMPRE volta a exigir troca, com senha digitada ou gerada automaticamente. Não há checkbox que permita burlar essa exigência.
- Editar somente nome/login/e-mail/função preserva a senha e a exigência existente.
- A pessoa entra com a senha inicial e recebe uma sessão restrita: somente consulta de sessão, troca de senha e saída. As páginas públicas permanecem públicas. As APIs administrativas recusam acesso até a troca.
- alterar-senha.html solicita a senha inicial, uma nova senha pessoal diferente e sua confirmação. O endpoint usa o ID da sessão, nunca um ID enviado pelo navegador. Salva PASSWORD_DEFAULT, limpa a exigência, regenera sessão/CSRF e então libera o sistema.
- Redefinir a senha invalida sessões anteriores. O controle usa uma impressão do hash guardada na sessão PHP; não precisa de coluna adicional para isso. A mudança de função vale na próxima requisição.
- Ninguém pode excluir a própria conta ou retirar seu próprio acesso de admin. O último admin não pode ser excluído ou rebaixado. Não há perfil especial por nome de usuário.
- Login/e-mail continuam únicos. Senhas têm ao menos 12 caracteres e até 72 bytes. O gerador existente cria senhas de 20 caracteres com aleatoriedade criptográfica e opção de copiar.

## SQL exato proposto

Arquivo: database/migrations/003_user_access_password.sql. Aplicar uma única vez e somente após revisão, backup e conferência de que os campos ainda não existem:

```sql
ALTER TABLE admins
    ADD COLUMN can_manage_users BOOLEAN NOT NULL DEFAULT 1,
    ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT 0;
```

Impacto: acrescenta somente duas flags. Preserva IDs, dados, senhas e privilégios das contas existentes; todas continuam admins e não precisam trocar senha apenas por causa dessa atualização. Não cria tabelas, histórico, perfis especiais ou substitutos externos. Contas novas da interface recebem a função selecionada e a exigência de troca explicitamente no INSERT.

A tabela mantém o nome admins por compatibilidade, embora agora também armazene operadores. O script privado de criação inicial continua sendo uma ferramenta explícita de bootstrap de administrador, com senha escolhida no terminal; ele não faz parte do cadastro de usuários com senha provisória na interface.

A alteração é aditiva. DDL MySQL pode fazer commit implícito e demandar bloqueio da tabela, portanto conferir backup e momento de aplicação. Pode-se manter os campos ao reverter código, sem apagar dados, mas a versão anterior tratava TODOS como administradores: voltar ao código anterior após criar operadores ampliaria seus privilégios. Não faça rollback funcional sem avaliar essas contas. Não há SQL destrutivo nem execução automática nesta proposta.

## Antes e depois da atualização manual

- Sem os dois campos, login, logout, consulta de sessão e conteúdo continuam funcionando. admin() lê o registro por SELECT * e devolve SOMENTE uma lista explícita de campos seguros; nunca retorna hash, impressão de sessão ou colunas futuras ao cliente.
- Os novos endpoints de gestão verificam a presença dos campos antes de consultar/gravar neles. Se ausentes, mostram uma mensagem específica de configuração da gestão (HTTP 409); não derrubam o login com 500/503. A interface de Usuários também informa esse estado.
- Não use esse modo de transição para ativar os recursos novos: aplique o SQL revisado antes de publicar. Em instalação nova, somente schema.sql já inclui os campos; não aplique também a migração.
- Sessões criadas pela versão anterior precisam entrar novamente por não terem a impressão de senha. Isso não muda as senhas.
- Após atualização manual e publicação futura, confira um cadastro de Operador, sua troca pessoal, uma edição de conteúdo e a negação de acesso à gestão; confira também um Admin.
- /home1/rpamec18/private/config.php e a alternativa RPA_CONFIG foram preservados. Nenhuma credencial foi alterada ou incluída no repositório.

## Testes executados

PHP 8.2.12 local com PDO simulado em uma cópia temporária. 59 verificações HTTP e 8 páginas passaram. Foram testados schema antigo sem as flags, transição simulada por fixtures JSON, autenticação, bloqueio de todas as áreas administrativas durante troca pendente, CSRF, senha atual incorreta, senha repetida, confirmação incorreta, troca pessoal vinculada à sessão, permissões, edição de contatos por operador, promoção/rebaixamento, proteção da própria/última conta administrativa, redefinição, invalidação de sessões, novo login, exclusão e logout. Senhas/hashes não aparecem nas respostas de contas. O parâmetro enviado para tentar desativar a exigência é ignorado: ela é imposta no backend.

O simulador não executa SQL nem comprova locks/índices/comportamento real de MySQL. Não houve integração com banco real, conforme a autorização limitada a preparar código/SQL. Sintaxe PHP/JavaScript e contratos de frontend também foram verificados. A inspeção visual no navegador e a execução final em PHP 8.3/MySQL da hospedagem ainda precisam ser feitas na etapa de validação autorizada.

Para reproduzir sem banco, execute tests/run-account-tests.ps1 no Windows com PHP local e Node disponíveis. O script usa uma pasta temporária, porta local 18079, fixtures e uma cópia de public; não altera o código publicável e encerra o servidor ao terminar. Não publique tests/ ou os arquivos temporários.
