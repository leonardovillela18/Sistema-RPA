# Sistema RPA

Site institucional com administração de produtos, contatos e conteúdo Sobre Nós. Usa HTML, CSS e JavaScript no navegador, PHP 8.2+ no servidor e MySQL/MariaDB. Não precisa de Node.js, npm ou instalação de dependências.

## Organização

```text
public/                 Única pasta publicável; copiar seu conteúdo para public_html
  *.html                Páginas do site
  assets/css/           Estilos das páginas e da navegação
  assets/js/            Scripts do navegador e cliente da API PHP
  assets/img/           Imagens fixas e imagem migrada
  api/auth/             Login, sessão e logout
  api/public/           Consulta do conteúdo público
  api/admin/            Alterações protegidas por sessão e CSRF
  api/admin/users/      Listagem e gerenciamento dos administradores
  api/bootstrap.php     Configuração, banco, validação e uploads
  uploads/products/     Imagens enviadas para produtos
  uploads/about/        Imagens enviadas para Sobre Nós
database/schema.sql     Estrutura MySQL e conteúdo público inicial
private/                Modelo de configuração e criação do administrador
.cpanel.yml             Publicação pelo Git/cPanel
README_DEPLOY.md        Instalação, publicação e verificações
```

`database/` fica fora de `public/` porque o SQL é importado pelo phpMyAdmin, não servido ao visitante. A configuração real fica fora da área pública e não é versionada. Os arquivos JavaScript em `public/assets/js/` executam no navegador e são necessários para o funcionamento das páginas.

Consulte [README_DEPLOY.md](README_DEPLOY.md) para configurar o banco, criar o administrador e publicar na HostGator. Abrir os arquivos HTML diretamente não substitui a execução do PHP e do banco.

Após entrar, use **Usuários** no cabeçalho para acessar `/usuarios.html`. Essa área permite buscar e criar contas, editar nome/login/e-mail e perfil (usuário ou administrador), alterar senhas e excluir outras contas. Usuários comuns podem entrar, mas não têm acesso às APIs administrativas. Antes de atualizar uma instalação existente, execute uma vez `database/migrations/001_user_roles.sql`. As contas existentes mantêm o perfil administrador. Consulte [o roteiro de testes](docs/TESTES_USUARIOS.md).
