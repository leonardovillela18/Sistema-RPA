<?php
require dirname(__DIR__,2).'/bootstrap.php';
require_admin(); $data=input(); $title=field($data,'introTitle',200); $text=field($data,'introText',20000);
$pdo=db(); $pdo->beginTransaction();
$q=$pdo->prepare('UPDATE about_content SET intro_title=?,intro_text=? WHERE id=1'); $q->execute([$title,$text]);
for($i=1;$i<=3;$i++) {
    $badge=field($data,'badge'.$i,100); $title=field($data,'title'.$i,200); $text=field($data,'text'.$i,20000);
    $q=$pdo->prepare('SELECT image_path FROM about_blocks WHERE position=? FOR UPDATE'); $q->execute([$i]); $old=$q->fetch(); if(!$old) throw new RuntimeException('Bloco ausente no banco.');
    $image=upload('image'.$i,'about')??$old['image_path'];
    $q=$pdo->prepare('UPDATE about_blocks SET badge=?,title=?,text=?,image_path=?,image_alt=? WHERE position=?'); $q->execute([$badge,$title,$text,$image,$title,$i]);
}
$q=$pdo->query('SELECT * FROM about_content WHERE id=1'); $intro=$q->fetch();
$q=$pdo->query('SELECT * FROM about_blocks ORDER BY position');
audit('update','about',1,['intro'=>$intro,'blocks'=>$q->fetchAll()]);
$pdo->commit(); success();
