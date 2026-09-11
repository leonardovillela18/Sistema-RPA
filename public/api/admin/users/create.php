<?php
require __DIR__.'/_common.php';
require_admin(); $data=input();
[$name,$login,$email,$role]=user_profile($data);
$hash=new_password($data); unique_profile($login,$email);
save_user('INSERT INTO admins (name,login,email,password_hash,role) VALUES (?,?,?,?,?)',[$name,$login,$email,$hash,$role]);
respond(['ok'=>true,'data'=>['id'=>(int)db()->lastInsertId()]],201);
