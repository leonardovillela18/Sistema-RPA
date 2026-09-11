<?php
require dirname(__DIR__,2).'/bootstrap.php';
require_admin(); $id=record_id(input()); db()->beginTransaction(); $q=db()->prepare('DELETE FROM products WHERE id=?'); $q->execute([$id]);
if(!$q->rowCount()) fail('Produto não encontrado.',404); audit('delete','products',$id); db()->commit(); success();
