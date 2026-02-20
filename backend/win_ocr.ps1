
param([string]$imagePath)

$ErrorActionPreference = "Stop"

# Standard, simple Windows OCR script
# Relies on standard WinRT projection in PowerShell
# If this fails, it's likely due to OS corruption or Resource Exhaustion (Disk/RAM)

try {
    # 1. Load Assembly (Just in case)
    $RuntimeDll = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Runtime.WindowsRuntime.dll"
    if (Test-Path $RuntimeDll) {
        try { Add-Type -Path $RuntimeDll -ErrorAction SilentlyContinue } catch {}
    }

    # 2. Resolve Path
    $absPath = [System.IO.Path]::GetFullPath($imagePath)
    if (-not (Test-Path $absPath)) { throw "File not found: $absPath" }

    # 3. Helper to wait for Async Operations
    function Await($Op) {
        $timeout = 0
        while ($Op.Status -eq 0) { 
            Start-Sleep -Milliseconds 50 
            $timeout++
            if ($timeout -gt 200) { throw "Timeout waiting for WinRT Operation" }
        }
        if ($Op.Status -eq 3) { throw "Operation Error code: " + $Op.ErrorCode }
        return $Op.GetResults()
    }

    # 4. Execute OCR Pipeline
    $fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($absPath)
    $file = Await($fileOp)

    $streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = Await($streamOp)

    $decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = Await($decoderOp)

    $bmpOp = $decoder.GetSoftwareBitmapAsync()
    $bitmap = Await($bmpOp)

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("en-US"))
    }
    
    if ($null -eq $engine) { throw "Could not create OCR Engine." }

    $recogOp = $engine.RecognizeAsync($bitmap)
    $result = Await($recogOp)

    # 5. Output
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Output $result.Text

}
catch {
    # Clean Error Output
    [Console]::Error.WriteLine("OCR_ERROR: " + $_.Exception.Message)
    exit 1
}
