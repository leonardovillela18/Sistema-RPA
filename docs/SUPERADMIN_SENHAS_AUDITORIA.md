# Superadmin, troca de senha e histórico

## Instalação existente na HostGator

1. Faça backup do banco e confirme que há uma conta com login leonardo.villela. Se ela não existir, interrompa a atualização e identifique a conta correta antes de executar SQL; a migração não cria usuários.
2. Execute UMA VEZ database/migrations/002_superadmin_password_audit.sql pelo phpMyAdmin. Confira o SELECT final: leonardo.villela deve aparecer como superadmin. Não execute a antiga migração de perfis retirada do projeto e não reimporte schema.sql.
3. Publique o conteúdo atualizado de public/ pelo processo habitual. O código novo requer a migração; ele não modifica o schema automaticamente. Falhas por tabela/coluna ausente retornam mensagem de atualização pendente (503), em vez de ocultar o problema como erro genérico.
4. Entre novamente. As sessões anteriores à atualização precisam de novo login. Teste a criação de um admin descartável com troca de senha obrigatória, a troca pessoal e uma edição do site antes de concluir a verificação.

A migração adiciona role (admin/superadmin), must_change_password e session_version em admins e cria audit_log. Preserva contas e hashes existentes. Promove somente leonardo.villela; os demais ficam como admin. Nenhuma senha inicial é gerada. O caminho /home1/rpamec18/private/config.php e a alternativa RPA_CONFIG permanecem iguais. Nenhum deploy ou acesso à produção foi realizado nesta implementação.

Em instalação nova, importe somente database/schema.sql e crie explicitamente a conta leonardo.villela pelo script privado create-admin.php. O script atribui superadmin a esse login no cadastro inicial; os privilégios posteriores são os gravados no banco, sem exceção por nome no login.

## Permissões e senhas

- Admin pode editar produtos, contatos e Sobre nós. Não pode listar ou gerenciar contas, nem consultar o histórico.
- Superadmin também gerencia contas e consulta o histórico na página Administradores. Pode atribuir admin ou superadmin a outras contas.
- A própria conta não pode ser excluída ou rebaixada. O último superadmin não pode ser excluído/rebaixado. Login e e-mail continuam únicos.
- Cadastro: informe senha e confirmação, perfil e a opção de exigir troca.
- Edição: senha em branco preserva a atual. Preencher senha e confirmação define uma senha provisória; a opção de exigir troca também está disponível na ação Alterar senha.
- A pessoa entra com a senha definida pelo superadmin e é direcionada a alterar-senha.html. Confirma a senha atual, escolhe uma diferente e confirma a nova. O servidor salva o hash, limpa a exigência, renova a sessão/CSRF e libera o acesso conforme o perfil.
- A exigência também bloqueia as APIs nas sessões já abertas. Redefinir senha invalida sessões anteriores; a troca pessoal invalida outras sessões, preservando somente a sessão que acabou de trocar a senha.
- Senhas exigem pelo menos 12 caracteres e no máximo 72 bytes. Hashes usam PASSWORD_DEFAULT. Senhas, hashes e tokens não são enviados à listagem nem ao histórico.

## Histórico

A tela de Administradores inclui histórico com autor (ID e login no momento da ação), data/hora do servidor, ação, área e ID do registro. Edições de produtos, contatos e Sobre nós armazenam também os valores salvos. Criação/exclusão e alterações de contas/senhas registram a ação sem guardar senhas. O registro permanece mesmo após excluir ou renomear o autor.

Conteúdo e histórico são gravados na mesma transação: uma falha no histórico impede confirmar a edição. O histórico começa nesta atualização; não reconstrói autores de alterações antigas. Consulta exclusiva de superadmin, com páginas de 50 registros e botão para carregar anteriores. Não há API para editar/apagar o histórico.

## Verificação local

Executado em PHP 8.2.12 e MariaDB 10.4.32 numa instância descartável em 127.0.0.1:13379, com aplicação em 127.0.0.1:18079. A migração foi aplicada ao schema anterior sem campos de permissão, promovendo uma conta de teste leonardo.villela sem modificar sua senha. O teste de integração está em tests/admin-security.cjs, usa apenas contas de teste e não deve ser executado contra produção. Para reproduzir, prepare um banco descartável com o schema anterior, a conta de teste leonardo.villela com senha Test-password-123 e o conteúdo inicial; aplique a migração, configure RPA_CONFIG para esse banco e inicie o PHP local. Execute node tests/admin-security.cjs. Node é somente o cliente de teste local; não é necessário em produção.

Aprovados: login, consulta de sessão, troca obrigatória e bloqueio das APIs, CSRF, rejeição de senha atual incorreta e de reutilização da senha, troca pessoal, restrição de admins nas APIs de usuários/histórico, redefinição na edição, invalidação de sessões, promoção/rebaixamento, proteção do próprio/último superadmin, edição de conteúdo com autoria, preservação do histórico após exclusão do autor e logout. Sintaxe PHP/JavaScript verificada. A execução local não substitui a conferência visual no navegador e a verificação final no PHP 8.3 da hospedagem.
