<?php
require __DIR__.'/_common.php';
require_superadmin(); $id=record_id(input());
$users=lock_users();
$pdo=db();
$ids=array_map('intval',array_keys($users));
protect_superadmin($users,$id);
if (count($ids)<=1) { $pdo->rollBack(); fail('Não é permitido excluir o último administrador.',409); }
if ($id===(int)$_SESSION['admin_id']) { $pdo->rollBack(); fail('Você não pode excluir a própria conta.',409); }
if (!in_array($id,$ids,true)) { $pdo->rollBack(); fail('Usuário não encontrado.',404); }
audit('delete','admins',$id);
$q=$pdo->prepare('DELETE FROM admins WHERE id=?'); $q->execute([$id]);
$pdo->commit(); respond(['ok'=>true,'data'=>['id'=>$id]]);
