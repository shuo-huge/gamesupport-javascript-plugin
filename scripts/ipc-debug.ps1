param([Parameter(Mandatory=$true)][string]$PluginDirectory)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath $PluginDirectory).Path
$manifest=Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$psi=[Diagnostics.ProcessStartInfo]::new()
$psi.FileName=Join-Path $root $manifest.runtime.executable
$psi.WorkingDirectory=$root
$psi.UseShellExecute=$false
$psi.CreateNoWindow=$true
$psi.RedirectStandardInput=$true
$psi.RedirectStandardOutput=$true
$psi.RedirectStandardError=$true
$process=[Diagnostics.Process]::Start($psi)
function Read-ProtocolLine {
 $read=$process.StandardOutput.ReadLineAsync()
 if (-not $read.Wait(5000)) { throw 'IPC response timed out' }
 $line=$read.Result
 if ($null -eq $line -or $line.Length -gt 65536) { throw 'Invalid IPC line' }
 Write-Host "< $line"
 return ($line | ConvertFrom-Json)
}
function Send-Protocol($Message) { $line=$Message | ConvertTo-Json -Compress -Depth 10; Write-Host "> $line"; $process.StandardInput.WriteLine($line); $process.StandardInput.Flush() }
try {
 $hello=Read-ProtocolLine
 if ($hello.type -ne 'hello' -or $hello.plugin_id -ne $manifest.id -or $hello.protocol -ne 'gs-ipc/1.0') { throw 'Invalid hello' }
 Send-Protocol @{type='initialize';request_id='init';protocol='gs-ipc/1.0';permissions=@('events.emit');config=@{}}
 if ((Read-ProtocolLine).type -ne 'ready') { throw 'Expected ready' }
 Send-Protocol @{type='command';command='start'}; $null=Read-ProtocolLine
 Send-Protocol @{type='command';command='ping';request_id='heartbeat'}
 if ((Read-ProtocolLine).type -ne 'pong') { throw 'Expected pong' }
 Send-Protocol @{type='command';command='configure';config=@{emit_test=$true}}
 if ((Read-ProtocolLine).event -ne 'example.pulse') { throw 'Expected example.pulse' }
 Send-Protocol @{type='command';command='stop'}; $null=Read-ProtocolLine
 if (-not $process.WaitForExit(3000)) { throw 'Stop timeout' }
 if ($process.ExitCode -ne 0) { throw "Unexpected exit code $($process.ExitCode)" }
 Write-Output 'GS-IPC handshake, heartbeat, event and stop: PASS'
} finally { if (-not $process.HasExited) { $process.Kill($true) }; $process.Dispose() }
