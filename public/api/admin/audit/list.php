<?php
require dirname(__DIR__,2).'/bootstrap.php';
require_superadmin('GET');
$before=isset($_GET['before'])?record_id(['id'=>$_GET['before']]):PHP_INT_MAX;
$q=db()->prepare('SELECT id,actor_id,actor_login,action,entity,record_id,details,created_at FROM audit_log WHERE id<? ORDER BY id DESC LIMIT 51'); $q->execute([$before]); $rows=$q->fetchAll();
$more=count($rows)>50; if ($more) array_pop($rows);
respond(['ok'=>true,'data'=>$rows,'next'=>$more?(int)end($rows)['id']:null]);
