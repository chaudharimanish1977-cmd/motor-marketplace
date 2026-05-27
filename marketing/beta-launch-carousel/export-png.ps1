# Exports each slide of beta-launch-carousel.pptx to PNG at 1080x1350.
# Uses PowerPoint COM automation. Run from this directory.

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$pptx = Join-Path $here "beta-launch-carousel.pptx"
$outDir = Join-Path $here "previews"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
Get-ChildItem $outDir -Filter "slide-*.png" | Remove-Item -Force -ErrorAction SilentlyContinue

$pp = New-Object -ComObject PowerPoint.Application
# msoFalse = 0, msoTrue = -1, msoCTrue = 1.  WithWindow=msoFalse to stay headless.
$pres = $pp.Presentations.Open($pptx, $true, $false, 0)

for ($i = 1; $i -le $pres.Slides.Count; $i++) {
    $slide = $pres.Slides.Item($i)
    $outPath = Join-Path $outDir ("slide-{0:D2}.png" -f $i)
    # Export at exact 1080x1350 — Slide.Export(filename, filterName, width, height)
    $slide.Export($outPath, "PNG", 1080, 1080)
    Write-Host "Wrote $outPath"
}

$pres.Close()
$pp.Quit()
