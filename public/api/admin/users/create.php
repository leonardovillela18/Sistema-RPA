<?php
require __DIR__.'/_common.php';
require_superadmin(); $data=input();
[$name,$login,$email,$role]=user_profile($data); $force=force_password($data);
$hash=new_password($data); unique_profile($login,$email); lock_users();
save_user('INSERT INTO admins (name,login,email,password_hash,role,must_change_password) VALUES (?,?,?,?,?,?)',[$name,$login,$email,$hash,$role,$force]);
$id=(int)db()->lastInsertId(); audit('create','admins',$id,['login'=>$login,'role'=>$role,'must_change_password'=>$force]);
db()->commit(); respond(['ok'=>true,'data'=>['id'=>$id]],201);
