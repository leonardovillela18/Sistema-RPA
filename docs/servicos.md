# Administração de serviços

Entre com uma conta de função **Admin** e abra a página Serviços. O botão **Cadastrar serviço** fica acima dos cartões. Dentro de cada pop-up, **Editar serviço e mídias** permite alterar título, subtítulos, descrições e listas, adicionar ou remover blocos e gerenciar a galeria. **Excluir serviço** solicita confirmação antes da exclusão.

A primeira mídia é a capa; o botão **Usar como capa** muda essa ordem. A galeria aceita até 12 fotos/vídeos por serviço: JPG, PNG e WebP até 5 MB por imagem; MP4 e WebM até 15 MB por vídeo. O total de novos arquivos de um salvamento é limitado a 15 MB. Vídeos têm controles de reprodução, sem reprodução automática. Use codecs compatíveis com os navegadores dos visitantes.

No computador, a galeria fica à esquerda e as informações à direita. Em telas menores, a galeria fica acima do texto. O catálogo da página inicial e o da página Serviços usam os mesmos dados.

## Persistência e implantação

- Os nove serviços originais são inicializados a partir de `public/api/services-seed.json`. A API salva o catálogo na tabela MySQL `service_catalog`, com revisão para impedir sobrescrita de alterações concorrentes.
- A tabela é criada no primeiro salvamento administrativo. Se a conta do banco não tiver permissão CREATE, importe `database/migrations/004_service_catalog.sql` antes de usar a edição. Depois disso, a API usa apenas SELECT, INSERT e UPDATE nessa tabela.
- Não há necessidade de reimportar o banco existente. Não altere o seed para editar um catálogo já salvo: utilize a interface administrativa.
- Os uploads ficam em `public/uploads/services`; o usuário do PHP precisa poder escrever nessa pasta. Faça backup dessa pasta junto com o banco. Remover uma mídia e salvar exclui o arquivo enviado; imagens originais do site são preservadas.
- Publique também `public/.user.ini` e `public/uploads/.htaccess`: eles ajustam os limites de upload e permitem servir vídeos sem habilitar execução de scripts. O PHP-FPM pode levar alguns minutos para recarregar `.user.ini`.
- A função Admin corresponde a `can_manage_users=1`, com senha inicial já alterada. As APIs verificam essa permissão e CSRF. Operadores e visitantes não podem alterar serviços nem cadastrar ou gerenciar usuários. A migração de contas `003_user_access_password.sql` continua sendo necessária para instalações antigas.

## Verificação

- `powershell -File tests/run-account-tests.ps1`: autenticação e gestão de usuários em fixture isolada.
- `powershell -File tests/run-services-tests.ps1`: testes HTTP de serviços com banco MySQL temporário na porta 3307 e servidor PHP na 18081. O banco temporário criado pelo teste é excluído ao terminar; o catálogo real não é alterado.
- `node tests/services-catalog.cjs`: testes de DOM e eventos; requer `npm install --prefix .test-runtime/ui-tools linkedom`. Esses testes não substituem conferência visual nem reprodução de vídeo em navegador real.
