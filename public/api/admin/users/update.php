<?php
require __DIR__.'/_common.php';
require_admin(); $data=input(); $id=record_id($data); user_exists($id);
[$name,$login,$email]=user_profile($data); unique_profile($login,$email,$id);
$users=lock_users();
if (!in_array($id,$users,true)) { db()->rollBack(); fail('Usuário não encontrado.',404); }
save_user('UPDATE admins SET name=?,login=?,email=? WHERE id=?',[$name,$login,$email,$id]);
db()->commit();
respond(['ok'=>true,'data'=>['id'=>$id]]);
