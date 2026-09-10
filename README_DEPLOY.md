# Publicação na HostGator

O site usa Apache, PHP 8.2 ou superior e MySQL/MariaDB com PDO. Publique apenas o conteúdo de `public/` na raiz do domínio. Não há instalação de pacotes nem processo de aplicação persistente.

## Primeira instalação

1. Faça backup dos arquivos atuais de `public_html` e do banco, se houver. O deploy copia arquivos e não remove os antigos: retire da área pública a versão anterior e qualquer arquivo privado antes da primeira publicação, preservando arquivos de validação de domínio necessários.
2. No cPanel, selecione PHP 8.2 ou superior e habilite `pdo_mysql`, `fileinfo` e sessões. Ative o certificado SSL para `rpamecanica.com.br`. O `.htaccess` redireciona HTTP para HTTPS.
3. Em Bancos de Dados MySQL, crie um banco e um usuário, vinculando o usuário ao banco com os privilégios necessários. Anote os nomes completos com o prefixo da conta.
4. Pelo phpMyAdmin, importe `database/schema.sql` **uma única vez em um banco vazio**. Ele inclui o produto, contatos e os três blocos Sobre Nós da versão anterior. A imagem do produto foi extraída para `public/assets/img/migrated-product.png`. Nenhuma conta ou sessão anterior é importada.
5. Fora de `public_html`, crie `/home1/rpamec18/rpa-private/config.php` a partir de `private/config.example.php`. Preencha DSN, usuário e senha reais; mantenha `secure_cookies` como `true`. Use permissão 600 se o PHP executar como o proprietário da conta. Não envie esse arquivo ao Git.
6. No terminal do cPanel, execute `php /home1/rpamec18/repositorios/Sistema-RPA/private/create-admin.php`. Informe nome, login, email e uma senha nova de 12 a 72 bytes. A senha não aparece no terminal e somente seu hash é gravado. Esse script também permite criar outro administrador com login/email distintos. Não o copie para a área pública. Se o terminal não estiver habilitado, peça ao suporte que execute esse script interativo em uma sessão segura; não existe instalador público.
7. No gerenciamento Git do cPanel, atualize o repositório e use a opção de deploy. `.cpanel.yml` copia exclusivamente `public/.` para `/home1/rpamec18/public_html/`, incluindo as proteções Apache. Confirme os caminhos se a conta for diferente. A cópia preserva uploads existentes e não usa exclusão automática.
8. Confirme que o PHP pode escrever em `public_html/uploads/products` e `public_html/uploads/about` (normalmente diretórios 755 e arquivos 644; não use 777). Os limites são 5 MB por imagem e 16 MB por requisição. Confira os limites efetivos do PHP no painel: `.user.ini` depende do modo de execução e pode levar alguns minutos para ser aplicada.

## Validação após publicar

- Abra Início, Serviços, Produtos, Sobre Nós, Contato e Acesso por HTTPS; confira imagens, mapas, links e visual no celular.
- Consulte `/api/public/snapshot.php`: deve retornar somente produtos, contatos e Sobre Nós.
- Entre com o novo administrador; crie, edite sem trocar a imagem, edite com outra imagem e exclua um produto. Atualize contatos e os três blocos Sobre Nós. Recarregue as páginas para confirmar persistência.
- Saia e confirme que os controles administrativos desaparecem. Um POST sem sessão a cada endpoint em `/api/admin/` deve receber 401; com sessão e sem CSRF, 403.
- Confirme no navegador que o cookie tem HttpOnly, Secure e SameSite=Lax. Sessões expiram após 30 minutos sem atividade. Login é limitado a dez tentativas por IP em 15 minutos.
- Envie JPG, PNG e WebP; verifique arquivos em `uploads` e somente caminhos no banco. Arquivos inválidos ou maiores que 5 MB devem ser rejeitados.
- Confirme que `/uploads/` não lista arquivos e que extensões executáveis são bloqueadas pelo Apache. Essa proteção depende de `AllowOverride` estar ativo; o servidor embutido do PHP não interpreta `.htaccess`.

## Operação e desenvolvimento

Validação local realizada com PHP 8.2.12 e MariaDB 10.4: sintaxe PHP/JavaScript, importação do schema, snapshot público, login/logout, rejeição de visitante e CSRF ausente, CRUD de produtos (incluindo edição sem nova imagem), atualização de contatos/Sobre Nós, upload válido e rejeição de conteúdo PHP disfarçado de imagem, e existência dos caminhos locais. HTTPS, regras Apache e aparência visual no navegador ainda precisam da validação de publicação descrita acima.

Faça backup periódico do banco e de `uploads`. Imagens substituídas/excluídas são conservadas para evitar remover arquivos ainda utilizados; uma limpeza manual pode comparar caminhos com o banco após backup. Atualizações futuras não devem reimportar o schema inicial.

Para teste local, crie um banco separado, importe o schema e crie `private/config.php` ignorado pelo Git. Somente em HTTP local, defina `secure_cookies` como `false`. Execute `php -S 127.0.0.1:8080 -t public`. Esse comando serve apenas ao desenvolvimento. Para usar outro arquivo privado, defina a variável de ambiente `RPA_CONFIG` com seu caminho absoluto.

A implementação legada e os arquivos temporários foram removidos. O histórico Git não foi reescrito; nunca reutilize credenciais antigas. A publicação e a configuração da conta HostGator precisam ser realizadas no ambiente da hospedagem.
