<?php
if(PHP_SAPI!=='cli') exit;
$name=getenv('RPA_SERVICE_TEST_DB');
if(!preg_match('/^rpa_services_test_[a-f0-9]{12}$/D',$name)) throw new RuntimeException('Nome de banco de teste inválido.');
$pdo=new PDO('mysql:host=127.0.0.1;port=3307;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
if(($argv[1]??'')==='cleanup') { $pdo->exec('DROP DATABASE `'.$name.'`'); exit; }
$pdo->exec('CREATE DATABASE `'.$name.'` CHARACTER SET utf8mb4');
$pdo->exec('USE `'.$name.'`');
$pdo->exec(file_get_contents(dirname(__DIR__).'/database/schema.sql'));
$q=$pdo->prepare('INSERT INTO admins (name,login,email,password_hash,can_manage_users,password_change_required) VALUES (?,?,?,?,?,0)');
foreach(['admin'=>1,'operator'=>0] as $login=>$role) $q->execute([$login,$login,$login.'@example.test',password_hash('Service-test-12345',PASSWORD_DEFAULT),$role]);
file_put_contents(getenv('RPA_CONFIG'), '<?php return '.var_export(['dsn'=>'mysql:host=127.0.0.1;port=3307;dbname='.$name.';charset=utf8mb4','user'=>'root','password'=>'','secure_cookies'=>false],true).';');
