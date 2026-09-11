param([string]$Php = 'C:/xampp/php/php.exe')
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path $env:TEMP ('rpa-account-test-' + [guid]::NewGuid().ToString('N'))
$oldConfig = $env:RPA_CONFIG
$oldFixture = $env:RPA_TEST_FIXTURE
$server = $null
try {
    New-Item -ItemType Directory -Path $testRoot | Out-Null
    Copy-Item -LiteralPath (Join-Path $workspace 'public') -Destination $testRoot -Recurse
    $bootstrapPath = Join-Path $testRoot 'public/api/bootstrap.php'
    $bootstrap = [IO.File]::ReadAllText($bootstrapPath)
    $mockPath = (Join-Path $PSScriptRoot 'mock-pdo.php').Replace('\','/')
    $bootstrap = $bootstrap.Replace("header('Content-Type: application/json; charset=utf-8');", "require '$mockPath';`nini_set('session.save_path',dirname(__DIR__,2));`nheader('Content-Type: application/json; charset=utf-8');")
    $bootstrap = [regex]::Replace($bootstrap,'new PDO\(\$c\[''dsn''\].*?\);','new FakePDO();')
    if (-not $bootstrap.Contains('$pdo=new FakePDO();')) { throw 'A cópia de teste não substituiu o PDO. Teste cancelado.' }
    [IO.File]::WriteAllText($bootstrapPath,$bootstrap,[Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllText((Join-Path $testRoot 'config.php'),"<?php return ['secure_cookies'=>false];",[Text.UTF8Encoding]::new($false))
    $env:RPA_CONFIG = Join-Path $testRoot 'config.php'
    $env:RPA_TEST_FIXTURE = Join-Path $testRoot 'fixture.json'
    $server = Start-Process -FilePath $Php -ArgumentList @('-S','127.0.0.1:18079','-t',('"' + $testRoot + '/public"')) -WindowStyle Hidden -PassThru -RedirectStandardOutput "$testRoot/php.out" -RedirectStandardError "$testRoot/php.err"
    Start-Sleep -Milliseconds 500
    if ($server.HasExited) { throw 'Servidor de teste não iniciou. Verifique a porta 18079.' }
    & node (Join-Path $PSScriptRoot 'account-flow.cjs')
    if ($LASTEXITCODE -ne 0) { throw "Teste falhou. Log PHP: $testRoot/php.err" }
} finally {
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id }
    $env:RPA_CONFIG = $oldConfig
    $env:RPA_TEST_FIXTURE = $oldFixture
}
