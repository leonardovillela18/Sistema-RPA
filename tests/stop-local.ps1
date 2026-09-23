$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $projectRoot '.test-runtime/local'
$phpPid = Join-Path $runtime 'php.pid'
if (Test-Path $phpPid) {
    $server = Get-Process -Id (Get-Content $phpPid) -ErrorAction SilentlyContinue
    if ($server -and $server.ProcessName -eq 'php' -and $server.StartTime.Ticks -eq (Get-Content "$runtime/php-start.txt")) { Stop-Process -Id $server.Id }
}
$dataDir = Join-Path $runtime 'mysql'
$actualData = & C:\xampp\mysql\bin\mysql.exe --no-defaults --host=127.0.0.1 --port=3307 --user=root --batch --raw --skip-column-names --execute="SELECT @@datadir" 2>$null
if ($LASTEXITCODE -eq 0 -and $actualData.TrimEnd("/", "\").Replace("/", "\") -eq $dataDir.Replace("/", "\")) {
    & C:\xampp\mysql\bin\mysqladmin.exe --no-defaults --host=127.0.0.1 --port=3307 --user=root shutdown
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao encerrar o banco.' }
}
Write-Host 'Ambiente parado. Dados de teste preservados.'


