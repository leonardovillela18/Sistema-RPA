<?php
// Exclusivo para teste em cópia temporária. Não abre conexão nem executa SQL.
class FakePDO extends PDO {
 public array $state; private ?array $backup=null; public int $last=1;
 public function __construct() { $file=getenv('RPA_TEST_FIXTURE'); $this->state=is_file($file)?json_decode(file_get_contents($file),true):['admins'=>[1=>['id'=>1,'name'=>'Teste','login'=>'admin_test','email'=>'admin@example.test','password_hash'=>password_hash('Test-password-123',PASSWORD_DEFAULT),'created_at'=>'2026-01-01 12:00:00','updated_at'=>'2026-01-01 12:00:00']]]; }
 public function persist(): void {if($this->backup===null)file_put_contents(getenv('RPA_TEST_FIXTURE'),json_encode($this->state));}
 public function prepare(string $query,array $options=[]): PDOStatement|false {return new FakeStatement($this,$query);}
 public function query(string $query,?int $fetchMode=null,mixed ...$fetchModeArgs): PDOStatement|false {$s=$this->prepare($query);$s->execute();return $s;}
 public function beginTransaction(): bool {$this->backup=$this->state;return true;}
 public function commit(): bool {$this->backup=null;$this->persist();return true;}
 public function rollBack(): bool {$this->state=$this->backup??$this->state;$this->backup=null;return true;}
 public function lastInsertId(?string $name=null): string|false {return (string)$this->last;}
}
class FakeStatement extends PDOStatement {
 private array $rows=[];private int $affected=0;
 public function __construct(private FakePDO $db,private string $text) {}
 public function execute(?array $params=null): bool {
  $p=$params??[];$q=$this->text;$users=&$this->db->state['admins'];$this->rows=[];
  if(str_contains($q,'login_attempts')) {
   if(str_starts_with($q,'SELECT'))$this->rows=[['attempts'=>0,'window_start'=>time()]];
  } elseif(preg_match('/^SELECT (.+) FROM admins(?: WHERE (.+))?$/',$q,$m)) {
   $columns=$m[1]==='*'?array_keys(reset($users)?:[]):explode(',',$m[1]);$where=$m[2]??'';
   foreach($users as $user) {
    if(in_array($where,['id=?','id=? FOR UPDATE'],true) && $user['id']!=$p[0])continue;
    if($where==='login=?' && $user['login']!==$p[0])continue;
    if($where==='login=? AND id<>?' && ($user['login']!==$p[0] || $user['id']==$p[1]))continue;
    if($where==='email=? AND id<>?' && ($user['email']!==$p[0] || $user['id']==$p[1]))continue;
    $row=[];foreach($columns as $col){if(!array_key_exists($col,$user))throw new RuntimeException('Coluna fora do contrato: '.$col);$row[$col]=$user[$col];}$this->rows[]=$row;
   }
  } elseif($q==='SELECT id,can_manage_users FROM admins ORDER BY id FOR UPDATE' || $q==='SELECT id,name,login,email,can_manage_users,password_change_required,created_at,updated_at FROM admins ORDER BY id') {
   foreach($users as $user){unset($user['password_hash']);$this->rows[]=$q==='SELECT id,can_manage_users FROM admins ORDER BY id FOR UPDATE'?['id'=>$user['id'],'can_manage_users'=>$user['can_manage_users']]:$user;}
  } elseif($q==='INSERT INTO admins (name,login,email,password_hash,can_manage_users,password_change_required) VALUES (?,?,?,?,?,1)') {
   $id=$users?max(array_keys($users))+1:1;$users[$id]=array_combine(['name','login','email','password_hash','can_manage_users'],$p)+['password_change_required'=>1]+['id'=>$id,'created_at'=>'2026-01-01 12:00:00','updated_at'=>'2026-01-01 12:00:00'];$this->db->last=$id;
  } elseif($q==='UPDATE admins SET name=?,login=?,email=?,can_manage_users=? WHERE id=?') {
   [$users[$p[4]]['name'],$users[$p[4]]['login'],$users[$p[4]]['email'],$users[$p[4]]['can_manage_users']]=array_slice($p,0,4);
  } elseif(preg_match('/^UPDATE admins SET password_hash=\?,password_change_required=([01]) WHERE id=\?$/',$q,$match)) {$users[$p[1]]['password_hash']=$p[0];$users[$p[1]]['password_change_required']=(int)$match[1];
  } elseif($q==='UPDATE admins SET password_hash=? WHERE id=?') {$users[$p[1]]['password_hash']=$p[0];
  } elseif($q==='DELETE FROM admins WHERE id=?') {unset($users[$p[0]]);$this->affected=1;
  } elseif(str_starts_with($q,'SELECT ') && str_contains($q,' FROM products ')) {$this->rows=[];
  } elseif(str_starts_with($q,'SELECT ') && str_contains($q,' FROM site_contacts ')) {$this->rows=[['phoneLabel'=>'123','phoneLink'=>'tel:+5511999999999','emailLabel'=>'test@example.test','emailLink'=>'mailto:test@example.test','instagramLabel'=>'teste','instagramLink'=>'https://example.test','address'=>'Teste','mapsLink'=>'https://example.test','mapsEmbed'=>'https://www.google.com/maps']];
  } elseif(str_starts_with($q,'SELECT ') && str_contains($q,' FROM about_content ')) {$this->rows=[['introTitle'=>'Teste','introText'=>'Teste']];
  } elseif(str_starts_with($q,'SELECT ') && str_contains($q,' FROM about_blocks ')) {$this->rows=[];
  } elseif(str_starts_with($q,'UPDATE site_contacts SET ')) {$this->affected=1;
  } else throw new RuntimeException('Operação não prevista no simulador: '.$q);
  $this->db->persist();return true;
 }
 public function fetch(int $mode=PDO::FETCH_DEFAULT,int $cursorOrientation=PDO::FETCH_ORI_NEXT,int $cursorOffset=0): mixed {return array_shift($this->rows)??false;}
 public function fetchAll(int $mode=PDO::FETCH_DEFAULT,mixed ...$args): array {if($mode===PDO::FETCH_KEY_PAIR){$result=[];foreach($this->rows as $row){$values=array_values($row);$result[$values[0]]=$values[1];}return $result;}return $mode===PDO::FETCH_COLUMN?array_map(fn($r)=>reset($r),$this->rows):$this->rows;}
 public function rowCount(): int {return $this->affected;}
}
