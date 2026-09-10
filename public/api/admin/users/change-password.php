<?php
require __DIR__.'/_common.php';
require_admin(); $data=input(); $id=record_id($data); user_exists($id);
$hash=new_password($data);
save_user('UPDATE admins SET password_hash=? WHERE id=?',[$hash,$id]);
respond(['ok'=>true,'data'=>['id'=>$id]]);
