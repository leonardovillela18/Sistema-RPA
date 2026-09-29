# Layout responsivo

`public/assets/css/responsive.css` é carregado por último em todas as páginas. Ele ajusta a largura dos blocos, quebra de textos longos, formulários, tabelas, janelas e áreas seguras de celulares com recortes na tela. O zoom continua habilitado.

A navegação compartilhada fica em `navigation.js` e `navbar-login.css`. Em janelas de até 980 px de largura ou até 500 px de altura, o botão Menu aparece à esquerda e abre uma lista vertical com os links e as ações de login/admin. Escape, clique externo, seleção de um link e rotação fecham o menu. O menu pode rolar quando a altura disponível for pequena.

O script mede a altura real da barra e acompanha `visualViewport` para ajustar as janelas quando o teclado ou as barras do navegador mudam a área visível. Há fallback para `resize` se `ResizeObserver` ou `visualViewport` não estiverem disponíveis.

A tabela de usuários mantém rolagem horizontal dentro da própria tabela. Os pop-ups têm rolagem interna; em paisagem, o catálogo mantém duas colunas de detalhes quando houver largura suficiente. Em retrato estreito, mídia e descrição ficam empilhadas.

## Verificação

Instale a dependência de testes, se necessário:

```powershell
npm install --prefix .test-runtime/ui-tools linkedom
node tests/responsive-navigation.cjs
node tests/services-catalog.cjs
```

Os testes de DOM cobrem menu, foco, rotação, teclado, zoom e permissões, incluindo as dimensões 320×568, 360×800, 390×844, 430×932 e suas versões em paisagem, além de tablet e desktop. Também validam sintaxe CSS e referências de arquivos. Não renderizam pixels.

A revisão visual em navegador real deve conferir as sete páginas, os pop-ups com conteúdo longo, a edição de serviços e usuários, o teclado aberto e a rotação com o menu ou pop-up aberto. Não houve navegador integrado disponível nesta sessão para concluir essa revisão.
