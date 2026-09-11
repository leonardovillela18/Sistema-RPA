<?php
// Executar pelo terminal do cPanel; nunca publicar este arquivo.
if(PHP_SAPI!=='cli') { http_response_code(404); exit; }
$configPath=getenv('RPA_CONFIG') ?: '/home1/rpamec18/private/config.php';
$config=require $configPath;
function ask(string $label): string { fwrite(STDOUT,$label); return trim(fgets(STDIN)); }
$name=ask('Nome: '); $login=ask('Login: '); $email=ask('Email: ');
if(!$name || strlen($name)>150 || !$login || strlen($login)>100 || !filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>254) exit("Dados inválidos.\n");
if(PHP_OS_FAMILY!=='Windows') {
    $state=shell_exec('stty -g'); if(!$state) exit("Use um terminal interativo.\n");
    shell_exec('stty -echo');
    try { $password=ask('Nova senha (mínimo 12 caracteres): '); $confirm=ask("\nRepita a senha: "); }
    finally { shell_exec('stty '.escapeshellarg(trim($state))); fwrite(STDOUT,"\n"); }
} else { exit("Execute no terminal Linux do cPanel.\n"); }
if(strlen($password)<12 || strlen($password)>72 || $password!==$confirm) exit("Senhas diferentes ou tamanho inválido (12–72 bytes).\n");
$pdo=new PDO($config['dsn'],$config['user'],$config['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false]);
$q=$pdo->prepare('INSERT INTO admins (name,login,email,password_hash,role) VALUES (?,?,?,?,?)');
$q->execute([$name,$login,$email,password_hash($password,PASSWORD_DEFAULT),$login==='leonardo.villela'?'superadmin':'admin']);
echo "Administrador criado.\n";
