document.querySelectorAll('.card').forEach(function(card){
  card.addEventListener('click', function(e){
    // se clicou num link dentro do painel, deixa o link funcionar normalmente
    if(e.target.tagName === 'A') return;
    var jaAtivo = card.classList.contains('ativo');
    // fecha todos
    document.querySelectorAll('.card.ativo').forEach(function(c){ c.classList.remove('ativo'); });
    // abre o clicado, exceto se já estava aberto
    if(!jaAtivo) card.classList.add('ativo');
  });
});