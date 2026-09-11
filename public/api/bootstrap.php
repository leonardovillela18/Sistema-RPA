<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
set_exception_handler(function (Throwable $e): void {
    error_log((string)$e);
    respond(['ok'=>false, 'message'=>'Não foi possível concluir a operação no servidor.'], 500);
});
function respond(array $data, int $status=200): never {
    http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit;
}
function fail(string $message, int $status=422): never { respond(['ok'=>false,'message'=>$message],$status); }
function config(): array {
    static $config;
    if ($config === null) {
        $path = getenv('RPA_CONFIG') ?: '/home1/rpamec18/private/config.php';
        if (!is_file($path)) throw new RuntimeException('Configuração privada ausente.');
        $config=require $path;
    }
    return $config;
}
function db(): PDO {
    static $pdo;
    if (!$pdo) { $c=config(); $pdo=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]); }
    return $pdo;
}
function session_open(): void {
    if(session_status()===PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode','1'); ini_set('session.use_only_cookies','1');
    session_name('rpa_session');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>config()['secure_cookies'] ?? true,'httponly'=>true,'samesite'=>'Lax']);
    session_start();
    if (isset($_SESSION['last_seen']) && time()-$_SESSION['last_seen']>1800) { $_SESSION=[]; session_regenerate_id(true); }
    $_SESSION['last_seen']=time();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}
function method(string $method): void {
    if (($_SERVER['REQUEST_METHOD']??'')!==$method) { header('Allow: '.$method); fail('Método não permitido.',405); }
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>17000000) fail('Requisição muito grande.',413);
}
function csrf(): void {
    session_open();
    if (!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')) fail('Sessão expirada. Recarregue a página.',403);
}
function admin(): ?array {
    session_open();
    if (empty($_SESSION['admin_id'])) return null;
    // SELECT * permite reconhecer os campos opcionais sem consultar colunas ausentes.
    // O retorno abaixo é uma lista explícita: nunca expõe hash ou colunas futuras.
    $q=db()->prepare('SELECT * FROM admins WHERE id=?'); $q->execute([$_SESSION['admin_id']]);
    $row=$q->fetch();
    if (!$row || !hash_equals(hash('sha256',$row['password_hash']),$_SESSION['auth_proof']??'')) return null;
    $ready=array_key_exists('can_manage_users',$row) && array_key_exists('password_change_required',$row);
    return ['id'=>$row['id'],'name'=>$row['name'],'login'=>$row['login'],'email'=>$row['email'],
        'features_ready'=>$ready,
        'can_manage_users'=>(bool)($row['can_manage_users']??true),
        'password_change_required'=>(bool)($row['password_change_required']??false)];
}
function require_admin(string $httpMethod='POST'): void {
    method($httpMethod);
    $user=admin();
    if (!$user) fail('Sessão expirada. Entre novamente.',401);
    if ($user['password_change_required']) respond(['ok'=>false,'code'=>'PASSWORD_CHANGE_REQUIRED','message'=>'Defina sua nova senha para continuar.'],403);
    if ($httpMethod !== 'GET') csrf();
}
function input(): array {
    if (str_starts_with($_SERVER['CONTENT_TYPE']??'','multipart/form-data')) return $_POST;
    try { $data=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR); } catch(JsonException $e) { fail('JSON inválido.'); }
    if (!is_array($data)) fail('Dados inválidos.'); return $data;
}
function field(array $data,string $key,int $max,bool $required=true): string {
    $v=$data[$key]??''; if(!is_string($v)) fail('Campo inválido: '.$key);
    $v=trim($v); if(($required && $v==='') || strlen($v)>$max) fail('Verifique o campo: '.$key); return $v;
}
function record_id(array $data): int {
    $id=filter_var($data['id']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
    if(!$id) fail('Identificador inválido.'); return $id;
}
function upload(string $field,string $folder): ?string {
    if(!isset($_FILES[$field]) || $_FILES[$field]['error']===UPLOAD_ERR_NO_FILE) return null;
    $f=$_FILES[$field];
    if(is_array($f['error']) || $f['error']!==UPLOAD_ERR_OK || $f['size']>5*1024*1024) fail('A imagem deve ter até 5 MB e ser enviada completamente.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
    if(!isset($types[$mime]) || !getimagesize($f['tmp_name'])) fail('Envie uma imagem JPG, PNG ou WebP válida.');
    $relative='/uploads/'.$folder.'/'.bin2hex(random_bytes(20)).'.'.$types[$mime];
    if(!move_uploaded_file($f['tmp_name'],dirname(__DIR__).$relative)) throw new RuntimeException('Falha ao salvar upload.');
    $GLOBALS['new_uploads'][]=dirname(__DIR__).$relative;
    return $relative;
}
// Remove arquivos de uma operação que falhou antes do commit.
register_shutdown_function(function (): void {
    if(empty($GLOBALS['uploads_committed'])) foreach($GLOBALS['new_uploads']??[] as $path) if(is_file($path)) unlink($path);
});
function success(): never { $GLOBALS['uploads_committed']=true; respond(['ok'=>true]); }

function require_user_manager(string $httpMethod='POST'): void {
    require_admin($httpMethod); $user=admin();
    require_account_features($user);
    if (!$user['can_manage_users']) fail('Somente administradores podem gerenciar usuários.',403);
}
function require_account_features(array $user): void {
    if (!$user['features_ready']) respond(['ok'=>false,'code'=>'ACCOUNT_SETUP_REQUIRED','message'=>'O gerenciamento de usuários aguarda a atualização manual aprovada do banco. O login continua disponível.'],409);
}
