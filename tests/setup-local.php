<?php
// Bootstrap exclusivo do ambiente local, executado pelo PowerShell.
if (PHP_SAPI !== 'cli') exit;
$root = dirname(__DIR__);
$runtime = $root . '/.test-runtime/local';
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE DATABASE IF NOT EXISTS rpa_teste CHARACTER SET utf8mb4');
$pdo->exec('USE rpa_teste');
if (!$pdo->query('SHOW TABLES')->fetchColumn()) {
    $pdo->exec(file_get_contents($root . '/database/schema.sql'));
}
$q = $pdo->prepare('SELECT id FROM admins WHERE login=?');
$q->execute(['admin.teste']);
if (!$q->fetchColumn()) {
    $password = 'Rpa!' . bin2hex(random_bytes(8));
    $pdo->prepare('INSERT INTO admins (name,login,email,password_hash,can_manage_users,password_change_required) VALUES (?,?,?,?,1,0)')->execute(['Administrador de Teste','admin.teste','admin@rpa.test',password_hash($password,PASSWORD_DEFAULT)]);
    file_put_contents($runtime . '/acesso.txt', "URL: http://127.0.0.1:18080\nLogin: admin.teste\nSenha: $password\n");
}
file_put_contents($runtime . '/config.php', "<?php return " . var_export(['dsn'=>'mysql:host=127.0.0.1;port=3307;dbname=rpa_teste;charset=utf8mb4','user'=>'root','password'=>'','secure_cookies'=>false],true) . ';');
echo "Banco de teste pronto.\n";
