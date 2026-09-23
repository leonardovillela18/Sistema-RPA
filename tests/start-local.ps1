param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $projectRoot '.test-runtime/local'
$php = 'C:\xampp\php\php.exe'
$mysqlBin = 'C:\xampp\mysql\bin'
function Port-Open([int]$port) {
    $client = New-Object Net.Sockets.TcpClient
    try { $client.Connect('127.0.0.1', $port); return $true } catch { return $false } finally { $client.Dispose() }
}
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
New-Item -ItemType Directory -Force -Path "$runtime/sessions", "$runtime/tmp" | Out-Null
$dataDir = Join-Path $runtime 'mysql'
if (!(Test-Path (Join-Path $dataDir 'mysql'))) {
    & "$mysqlBin\mysql_install_db.exe" "--datadir=$dataDir" --port=3307
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao inicializar o banco local.' }
}
if (!(Port-Open 3307)) {
    $db = Start-Process "$mysqlBin\mysqld.exe" -ArgumentList @('--no-defaults', ('--basedir="C:/xampp/mysql"'), ('--datadir="' + $dataDir + '"'), '--port=3307', '--bind-address=127.0.0.1', '--standalone', '--console') -WindowStyle Hidden -PassThru -RedirectStandardOutput "$runtime/mysql.out.log" -RedirectStandardError "$runtime/mysql.err.log"
    $db.Id | Set-Content "$runtime/mysql.pid"
    for ($i=0; $i -lt 40 -and !(Port-Open 3307); $i++) { Start-Sleep -Milliseconds 250 }
    if (!(Port-Open 3307)) { throw "Banco nao iniciou. Consulte $runtime/mysql.err.log" }
} else {
    $actualData = & "$mysqlBin\mysql.exe" --no-defaults --host=127.0.0.1 --port=3307 --user=root --batch --raw --skip-column-names --execute="SELECT @@datadir"
    $owned = $LASTEXITCODE -eq 0 -and $actualData.TrimEnd("/", "\").Replace("/", "\") -eq $dataDir.Replace("/", "\")
    if (!$owned) { throw 'Porta 3307 ocupada por outro banco. Nenhuma alteracao realizada nele.' }
}
& $php "$PSScriptRoot/setup-local.php"
if ($LASTEXITCODE -ne 0) { throw 'Falha na preparacao do banco.' }
if (!(Port-Open 18080)) {
    $previousConfig = $env:RPA_CONFIG
    try {
        $env:RPA_CONFIG = Join-Path $runtime 'config.php'
        $server = Start-Process $php -ArgumentList @('-d', ('session.save_path="' + $runtime + '/sessions"'), '-d', ('upload_tmp_dir="' + $runtime + '/tmp"'), '-d','upload_max_filesize=5M','-d','post_max_size=16M','-S','127.0.0.1:18080','-t', ('"' + $projectRoot + '\public"')) -WindowStyle Hidden -PassThru -RedirectStandardOutput "$runtime/php.out.log" -RedirectStandardError "$runtime/php.err.log"
        $server.Id | Set-Content "$runtime/php.pid"
        $server.StartTime.Ticks | Set-Content "$runtime/php-start.txt"
    } finally { $env:RPA_CONFIG = $previousConfig }
    for ($i=0; $i -lt 20 -and !(Port-Open 18080); $i++) { Start-Sleep -Milliseconds 250 }
    if (!(Port-Open 18080)) { throw 'Servidor PHP nao iniciou. Consulte os logs.' }
} else {
    $owned = $false
    if (Test-Path "$runtime/php.pid") {
        $existing = Get-Process -Id (Get-Content "$runtime/php.pid") -ErrorAction SilentlyContinue
        $owned = $existing -and $existing.ProcessName -eq "php" -and $existing.StartTime.Ticks -eq (Get-Content "$runtime/php-start.txt")
    }
    if (!$owned) { throw 'Porta 18080 ocupada por outro servidor.' }
}
$null = Invoke-RestMethod 'http://127.0.0.1:18080/api/public/snapshot.php'
Get-Content "$runtime/acesso.txt"
if (!$NoBrowser) { Start-Process 'http://127.0.0.1:18080' }



