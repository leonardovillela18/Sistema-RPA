<?php
require __DIR__.'/_common.php';
require_admin(); $id=record_id(input());
$pdo=db(); $pdo->beginTransaction();
// Serializa exclusões e revalida a conta que executa a operação sob o mesmo bloqueio.
$q=$pdo->prepare('SELECT id FROM admins ORDER BY id FOR UPDATE'); $q->execute();
$ids=array_map('intval',$q->fetchAll(PDO::FETCH_COLUMN));
if (!in_array((int)$_SESSION['admin_id'],$ids,true)) { $pdo->rollBack(); fail('Sessão expirada. Entre novamente.',401); }
if (count($ids)<=1) { $pdo->rollBack(); fail('Não é permitido excluir o último administrador.',409); }
if ($id===(int)$_SESSION['admin_id']) { $pdo->rollBack(); fail('Você não pode excluir a própria conta.',409); }
if (!in_array($id,$ids,true)) { $pdo->rollBack(); fail('Administrador não encontrado.',404); }
$q=$pdo->prepare('DELETE FROM admins WHERE id=?'); $q->execute([$id]);
$pdo->commit(); respond(['ok'=>true,'data'=>['id'=>$id]]);
