<?php
require __DIR__.'/_common.php';
require_admin('GET');
$q=db()->prepare('SELECT id,name,login,email,role,created_at,updated_at FROM admins ORDER BY id');
$q->execute();
respond(['ok'=>true,'data'=>$q->fetchAll()]);
