<?php
require __DIR__.'/_common.php';
require_user_manager(); $data=input();
[$name,$login,$email,$manager]=user_profile($data);
$hash=new_password($data); unique_profile($login,$email); lock_users();
save_user('INSERT INTO admins (name,login,email,password_hash,can_manage_users,password_change_required) VALUES (?,?,?,?,?,1)',[$name,$login,$email,$hash,$manager]);
$id=(int)db()->lastInsertId(); db()->commit(); respond(['ok'=>true,'data'=>['id'=>$id]],201);
