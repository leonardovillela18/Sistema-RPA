<?php
require __DIR__.'/_common.php';
require_user_manager('GET');
$q=db()->prepare('SELECT id,name,login,email,can_manage_users,password_change_required,created_at,updated_at FROM admins ORDER BY id');
$q->execute();
respond(['ok'=>true,'data'=>$q->fetchAll()]);
