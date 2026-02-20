
param([string]$imagePath)
$ErrorActionPreference = "Stop"
$RuntimeDll = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Runtime.WindowsRuntime.dll"
try { Add-Type -Path $RuntimeDll } catch {}

[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]

try {
    $absPath = [System.IO.Path]::GetFullPath($imagePath)
    $op = [Windows.Storage.StorageFile]::GetFileFromPathAsync($absPath)
    
    Write-Host "--- Status Loop ---"
    while ($op.Status -eq 0) { Start-Sleep -Milliseconds 50 }
    Write-Host "Status: $($op.Status)"
    
    Write-Host "--- Get-Member ---"
    $op | Get-Member -Force | Out-String | Write-Host
    
    Write-Host "--- Select * ---"
    $op | Select-Object * | Out-String | Write-Host

    Write-Host "--- Attempting Access ---"
    if ($op.Status -eq 1) {
        try { Write-Host "GetResults(): $($op.GetResults().Path)" } catch { Write-Host "GetResults failed: $_" }
        try { Write-Host "Result: $($op.Result)" } catch { Write-Host "Result failed: $_" }
        try { Write-Host "Results: $($op.Results)" } catch { Write-Host "Results failed: $_" }
    }

}
catch {
    Write-Host "Error: $_"
}
