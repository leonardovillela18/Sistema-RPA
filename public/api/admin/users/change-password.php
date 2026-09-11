<?php
require __DIR__.'/_common.php';
require_superadmin(); $data=input(); $id=record_id($data); $hash=new_password($data); $force=force_password($data);
$users=lock_users(); if (!isset($users[$id])) { db()->rollBack(); fail('Usuário não encontrado.',404); }
audit('password_reset','admins',$id,['must_change_password'=>$force]);
save_user('UPDATE admins SET password_hash=?,must_change_password=?,session_version=session_version+1 WHERE id=?',[$hash,$force,$id]);
db()->commit(); respond(['ok'=>true]);
