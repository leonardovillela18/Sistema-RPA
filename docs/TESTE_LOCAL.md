# Ambiente de teste local (Windows)

Dê dois cliques em `iniciar-teste.bat` na raiz do projeto. O navegador abre em http://127.0.0.1:18080. O terminal mostra o login e a senha, também salvos em `.test-runtime/local/acesso.txt` (ignorado pelo Git).

Use `parar-teste.bat` para encerrar PHP e banco. Os dados persistem entre inicializações. Não é necessário iniciar os serviços no painel do XAMPP.

Requisitos: PHP e MariaDB do XAMPP instalados em `C:\xampp`. O script cria uma instância MariaDB exclusiva na porta 3307, limitada a 127.0.0.1, com dados em `.test-runtime/local/mysql`. O schema é importado somente se o banco `rpa_teste` estiver vazio. Uma conta `admin.teste` recebe senha aleatória na criação inicial; a senha não é redefinida ao reiniciar.

O PHP usa a configuração local via `RPA_CONFIG`, sem alterar a configuração da hospedagem. O ambiente serve os arquivos atuais de `public`, portanto alterações no código aparecem ao recarregar a página. Uploads feitos nos testes ficam em `public/uploads`; registros e edições de conteúdo ficam no banco local. Não publique `.test-runtime`, `tests` ou os atalhos.

Este servidor é para testes locais por HTTP. As regras Apache de `.htaccess` e HTTPS precisam ser verificadas na hospedagem.

Para iniciar pelo PowerShell sem abrir o navegador:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/start-local.ps1 -NoBrowser
```
