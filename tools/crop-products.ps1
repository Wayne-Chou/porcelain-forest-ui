<#
=========================================================
 商品圖片：自動裁掉四周的白邊，再補回約 4% 的留白（推薦商品卡用，img/products/）

 用法（在專案根目錄，Windows PowerShell 5.1 以上）：
   powershell -ExecutionPolicy Bypass -File tools\crop-products.ps1
   有新圖時：把新圖放進 img/products/ 再跑一次即可

 做法：
   1. 原檔先備份到 img/products/original/（檔名不變；已經有備份就不覆蓋），之後一律從備份裁切，重跑結果相同
   2. 找出「接近白色」的邊框：每個色版都 >= Threshold（預設 235）算白色；
      一列（一欄）裡非白色的像素少於 Noise（預設 0.5%）就當成邊框，容許少量雜色
   3. 裁到商品的範圍，四周補回 PadRatio（預設 4%，以裁切後較長的一邊計算）的留白；
      留白顏色用原圖邊框的平均色（白底 = 白色；淺灰底的圖不會出現接縫）
   4. 四邊都裁不到 1% 的圖（例如滿版的情境照）不處理，照原檔
   5. 覆蓋 img/products/ 的同名檔案（JPEG 品質 92；PNG 維持 PNG），最後列出裁切前後的尺寸
=========================================================
#>
param(
  [string]$Dir = (Join-Path $PSScriptRoot "..\img\products"),
  [int]$Threshold = 235,
  [double]$Noise = 0.005,
  [double]$PadRatio = 0.04,
  [int]$Quality = 92
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class KfTrim {
  // 回傳 [left, top, right, bottom, bgR, bgG, bgB]（right、bottom 為不含）；整張都是白色時回傳 null
  public static int[] Find(Bitmap src, int threshold, double noise) {
    int w = src.Width, h = src.Height;
    var bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (var g = Graphics.FromImage(bmp)) { g.Clear(Color.White); g.DrawImage(src, 0, 0, w, h); }
    var data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    var px = new byte[data.Stride * h];
    Marshal.Copy(data.Scan0, px, 0, px.Length);
    int stride = data.Stride;
    bmp.UnlockBits(data);
    bmp.Dispose();
    var rowInk = new int[h];
    var colInk = new int[w];
    for (int y = 0; y < h; y++) {
      int o = y * stride;
      for (int x = 0; x < w; x++, o += 4) {
        if (px[o] < threshold || px[o + 1] < threshold || px[o + 2] < threshold) { rowInk[y]++; colInk[x]++; }
      }
    }
    int rowLimit = (int)Math.Ceiling(w * noise), colLimit = (int)Math.Ceiling(h * noise);
    int top = 0; while (top < h && rowInk[top] <= rowLimit) top++;
    if (top == h) return null;
    int bottom = h; while (bottom > top && rowInk[bottom - 1] <= rowLimit) bottom--;
    int left = 0; while (left < w && colInk[left] <= colLimit) left++;
    int right = w; while (right > left && colInk[right - 1] <= colLimit) right--;
    // 邊框平均色：最外圈一像素
    long r = 0, gg = 0, b = 0, n = 0;
    for (int x = 0; x < w; x++) foreach (int y in new[] { 0, h - 1 }) { int o = y * stride + x * 4; b += px[o]; gg += px[o + 1]; r += px[o + 2]; n++; }
    for (int y = 0; y < h; y++) foreach (int x in new[] { 0, w - 1 }) { int o = y * stride + x * 4; b += px[o]; gg += px[o + 1]; r += px[o + 2]; n++; }
    return new[] { left, top, right, bottom, (int)(r / n), (int)(gg / n), (int)(b / n) };
  }
}
"@

$Dir = (Resolve-Path $Dir).Path
$Backup = Join-Path $Dir "original"
New-Item -ItemType Directory -Force $Backup | Out-Null
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$Quality)

$rows = foreach ($file in Get-ChildItem $Dir -File | Where-Object { $_.Extension -match '^\.(jpe?g|png)$' }) {
  $orig = Join-Path $Backup $file.Name
  if (-not (Test-Path $orig)) { Copy-Item $file.FullName $orig }   # 1. 先備份（已有備份就不覆蓋）
  # 從備份讀進記憶體（不鎖住檔案，才能覆蓋）
  $bytes = [System.IO.File]::ReadAllBytes($orig)
  $ms = New-Object System.IO.MemoryStream (, $bytes)
  $src = [System.Drawing.Bitmap]::FromStream($ms)
  $w = $src.Width; $h = $src.Height
  $box = [KfTrim]::Find($src, $Threshold, $Noise)
  $note = ""
  if (-not $box) { $note = "整張都是白色，不處理" }
  else {
    $l, $t, $r, $b = $box[0..3]
    $minW = [math]::Ceiling($w * 0.01); $minH = [math]::Ceiling($h * 0.01)
    if ($l -lt $minW -and $t -lt $minH -and ($w - $r) -lt $minW -and ($h - $b) -lt $minH) { $note = "沒有白邊，不處理" }
  }
  if ($note) {
    Copy-Item $orig $file.FullName -Force
    [pscustomobject]@{ 檔名 = $file.Name; 裁切前 = "${w}x${h}"; 商品範圍 = "-"; 裁切後 = "${w}x${h}"; 備註 = $note }
  } else {
    $cw = $r - $l; $ch = $b - $t
    $pad = [int][math]::Round([math]::Max($cw, $ch) * $PadRatio)
    $nw = $cw + 2 * $pad; $nh = $ch + 2 * $pad
    $out = New-Object System.Drawing.Bitmap $nw, $nh
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.Clear([System.Drawing.Color]::FromArgb($box[4], $box[5], $box[6]))
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle $pad, $pad, $cw, $ch), (New-Object System.Drawing.Rectangle $l, $t, $cw, $ch), [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    if ($file.Extension -match '^\.png$') { $out.Save($file.FullName, [System.Drawing.Imaging.ImageFormat]::Png) }
    else { $out.Save($file.FullName, $jpeg, $encParams) }
    $out.Dispose()
    [pscustomobject]@{ 檔名 = $file.Name; 裁切前 = "${w}x${h}"; 商品範圍 = "x$l-$r y$t-$b"; 裁切後 = "${nw}x${nh}"; 備註 = "留白 ${pad}px，底色 rgb($($box[4]),$($box[5]),$($box[6]))" }
  }
  $src.Dispose(); $ms.Dispose()
}
$rows | Format-Table -AutoSize | Out-String -Width 200
