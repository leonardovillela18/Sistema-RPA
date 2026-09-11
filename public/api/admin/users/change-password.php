<?php
require __DIR__.'/_common.php';
require_user_manager(); $data=input(); $id=record_id($data); $hash=new_password($data);
$users=lock_users(); if (!isset($users[$id])) { db()->rollBack(); fail('Usuário não encontrado.',404); }
save_user('UPDATE admins SET password_hash=?,password_change_required=1 WHERE id=?',[$hash,$id]);
db()->commit(); respond(['ok'=>true,'data'=>['id'=>$id]]);
