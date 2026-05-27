# Render announcement.pptx slides to PNG at 1080×1080.
$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$pptx = Join-Path $here "announcement.pptx"
$outDir = Join-Path $here "previews-announcement"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
Get-ChildItem $outDir -Filter "slide-*.png" | Remove-Item -Force -ErrorAction SilentlyContinue

$pp = New-Object -ComObject PowerPoint.Application
$pres = $pp.Presentations.Open($pptx, $true, $false, 0)

for ($i = 1; $i -le $pres.Slides.Count; $i++) {
    $slide = $pres.Slides.Item($i)
    $outPath = Join-Path $outDir ("slide-{0:D2}.png" -f $i)
    $slide.Export($outPath, "PNG", 1080, 1080)
    Write-Host "Wrote $outPath"
}

$pres.Close()
$pp.Quit()
