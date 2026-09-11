<?php
require __DIR__.'/_common.php';
require_user_manager(); $data=input(); $id=record_id($data);
[$name,$login,$email,$manager]=user_profile($data); unique_profile($login,$email,$id);
$users=lock_users(); if (!isset($users[$id])) { db()->rollBack(); fail('Usuário não encontrado.',404); }
if (!$manager) protect_manager($users,$id);
save_user('UPDATE admins SET name=?,login=?,email=?,can_manage_users=? WHERE id=?',[$name,$login,$email,$manager,$id]);
db()->commit(); respond(['ok'=>true,'data'=>['id'=>$id]]);
