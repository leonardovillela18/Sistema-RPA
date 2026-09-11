> Documento histórico de uma versão anterior. Para os perfis e a troca de senha atuais, siga [SUPERADMIN_SENHAS_AUDITORIA.md](SUPERADMIN_SENHAS_AUDITORIA.md).

# Correção de compatibilidade da administração

A consulta de sessão e o gerenciamento dependiam de uma coluna de permissão ausente no banco de produção. Agora qualquer conta autenticada e existente em admins é administradora. O contrato de me.php retorna id, name, login e email, sem senha ou hash; sem autenticação, retorna HTTP 200 com user null e token CSRF.

Não há migração de banco. A migração de perfis foi removida. Não recrie tabelas, não reimporte schema.sql e não altere contas existentes. O caminho /home1/rpamec18/private/config.php e a alternativa RPA_CONFIG foram preservados.

## Validação executada nesta correção

Testes HTTP locais em PHP 8.2.12 e MariaDB 10.4.32, com instância temporária isolada na interface de loopback e schema do projeto sem coluna de permissão. Nenhuma conta ou banco existente foi alterado; somente contas descartáveis no banco de teste foram usadas. Os servidores temporários foram encerrados depois dos testes. Node foi usado apenas como cliente de teste local, sem dependência nova na aplicação ou produção.

- Login válido e inválido; consulta de sessão com e sem autenticação; logout e perda de acesso.
- Ausência de senha/hash e campo de permissão no retorno da sessão e da listagem.
- Listagem, criação, edição de nome/login/e-mail e login com os dados editados, preservando a senha.
- Alteração de senha: senha anterior rejeitada e nova senha aceita.
- Rejeição de login/e-mail duplicados e senha curta.
- HTTP 401 nas cinco APIs de gerenciamento sem sessão; HTTP 403 nas quatro mutações sem CSRF.
- HTTP 409 ao excluir o último administrador e ao excluir a própria conta quando existe outra conta.
- Exclusão de outro administrador, atualização da lista e perda de acesso da sessão da conta excluída.
- Snapshot público com ok true e HTTP 200 nas páginas index, servicos, produtos, sobre, contato, acesso e usuarios.
- Sintaxe de todos os PHP e JavaScript; revisão global de consultas da tabela admins.

Não foi feita inspeção visual no navegador nem execução no PHP 8.3 da HostGator. O layout existente foi preservado, removendo apenas o seletor/coluna de perfil e seus estilos. A compatibilidade com PHP 8.3 foi revisada no código; os testes de execução acima utilizaram o PHP local disponível.

## Publicação manual

Publicar os arquivos corrigidos de public/ pelo fluxo habitual, sem executar SQL. Depois conferir /api/auth/me.php sem sessão, entrar com um administrador existente e abrir /usuarios.html. Não houve deploy nesta correção. Consulte também TESTES_ADMINISTRADORES.md para o roteiro manual completo; o relato de testes naquele documento corresponde à versão anterior.
