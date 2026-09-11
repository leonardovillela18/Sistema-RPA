<?php
require __DIR__.'/_common.php';
require_superadmin('GET');
$q=db()->prepare('SELECT id,name,login,email,role,must_change_password,created_at,updated_at FROM admins ORDER BY id');
$q->execute();
respond(['ok'=>true,'data'=>$q->fetchAll()]);
