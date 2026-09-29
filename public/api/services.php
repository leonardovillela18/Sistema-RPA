<?php
declare(strict_types=1);
require_once __DIR__.'/bootstrap.php';
if (realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__) fail('Recurso não encontrado.',404);

function services_seed(): array {
    return json_decode(file_get_contents(__DIR__.'/services-seed.json'),true,32,JSON_THROW_ON_ERROR);
}
function services_catalog(bool $lock=false): array {
    try { $row=db()->query('SELECT revision,payload FROM service_catalog WHERE id=1'.($lock?' FOR UPDATE':''))->fetch(); }
    catch (PDOException $e) { if (!$lock && ($e->errorInfo[1]??0)===1146) return ['revision'=>0,'services'=>services_seed()]; throw $e; }
    return $row ? ['revision'=>(int)$row['revision'],'services'=>json_decode($row['payload'],true,32,JSON_THROW_ON_ERROR)] : ['revision'=>0,'services'=>services_seed()];
}
function services_initialize(): void {
    try { if(db()->query('SELECT id FROM service_catalog WHERE id=1')->fetch()) return; }
    catch(PDOException $e) {
        if(($e->errorInfo[1]??0)!==1146) throw $e;
        db()->exec('CREATE TABLE IF NOT EXISTS service_catalog (id INT PRIMARY KEY, revision INT NOT NULL DEFAULT 0, payload LONGTEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }
    $q=db()->prepare('INSERT IGNORE INTO service_catalog (id,revision,payload) VALUES (1,0,?)');
    $q->execute([json_encode(services_seed(),JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
}
function services_lock(array $data): array {
    $revision=filter_var($data['revision']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>0]]);
    if ($revision===false || $revision===null) fail('Atualize o catálogo antes de salvar.');
    services_initialize(); db()->beginTransaction();
    $catalog=services_catalog(true);
    require_user_manager();
    if ($catalog['revision']!==$revision) { db()->rollBack(); fail('Outro administrador alterou o catálogo. Recarregue a página antes de editar novamente.',409); }
    return $catalog;
}
function services_commit(array $catalog, array $removed=[]): never {
    $q=db()->prepare('UPDATE service_catalog SET revision=?,payload=? WHERE id=1');
    $q->execute([$catalog['revision']+1,json_encode(array_values($catalog['services']),JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
    db()->commit(); $GLOBALS['uploads_committed']=true;
    // Somente uploads do serviço removido; imagens originais do catálogo são preservadas.
    foreach ($removed as $media) {
        $url=$media['url'];
        if (preg_match('~^/uploads/services/[a-f0-9]{40}\.(jpg|png|webp|mp4|webm)$~D',$url)) {
            $path=dirname(__DIR__).$url;
            if(is_file($path) && !unlink($path)) error_log('Não foi possível remover mídia de serviço: '.$path);
        }
    }
    respond(['ok'=>true,'revision'=>$catalog['revision']+1,'services'=>array_values($catalog['services'])]);
}
function service_sections(array $data): array {
    $sections=$data['sections']??null;
    if (!is_array($sections) || !array_is_list($sections) || count($sections)>30) fail('Use até 30 blocos de informações.');
    $clean=[];
    foreach ($sections as $section) {
        if(!is_array($section)) fail('Bloco de informações inválido.');
        $heading=field($section,'heading',200,false); $text=field($section,'text',16000,false);
        $items=$section['items']??[];
        if(!is_array($items) || !array_is_list($items) || count($items)>50) fail('Lista de informações inválida.');
        foreach($items as &$item) { if(!is_string($item) || strlen($item)>2000) fail('Item de lista inválido.'); $item=trim($item); } unset($item);
        $items=array_values(array_filter($items,fn($item)=>$item!==''));
        if($heading!=='' || $text!=='' || $items) $clean[]=['heading'=>$heading,'text'=>$text,'items'=>$items];
    }
    if(!$clean) fail('Informe uma descrição do serviço.');
    return $clean;
}
function service_uploads(): array {
    $files=$_FILES['media']??null;
    if(!$files) return [];
    if(!isset($files['error']) || !is_array($files['error']) || count($files['error'])>12) fail('Envie até 12 mídias por serviço.');
    $folder=dirname(__DIR__).'/uploads/services';
    if(!is_dir($folder) && !mkdir($folder,0755,true)) throw new RuntimeException('Pasta de mídias indisponível.');
    $result=[];
    foreach($files['error'] as $i=>$error) {
        if($error===UPLOAD_ERR_NO_FILE) continue;
        if($error!==UPLOAD_ERR_OK) fail('Upload incompleto ou acima do limite. Envie até 15 MB por vez.');
        $size=$files['size'][$i]; $tmp=$files['tmp_name'][$i];
        if(!is_string($tmp) || !is_uploaded_file($tmp) || $size<1 || $size>15*1024*1024) fail('Mídia inválida ou acima de 15 MB.');
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($tmp);
        $types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','video/mp4'=>'mp4','video/webm'=>'webm'];
        if(!isset($types[$mime])) fail('Use imagens JPG, PNG, WebP ou vídeos MP4 e WebM.');
        $isImage=str_starts_with($mime,'image/');
        if($isImage && ($size>5*1024*1024 || !getimagesize($tmp))) fail('Envie imagens válidas de até 5 MB.');
        $id=bin2hex(random_bytes(20)); $url='/uploads/services/'.$id.'.'.$types[$mime];
        if(!move_uploaded_file($tmp,dirname(__DIR__).$url)) throw new RuntimeException('Falha ao salvar mídia.');
        $GLOBALS['new_uploads'][]=dirname(__DIR__).$url;
        $result[]=['id'=>$id,'url'=>$url,'type'=>$isImage?'image':'video'];
    }
    return $result;
}
