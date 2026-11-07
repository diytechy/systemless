[CmdletBinding()]
param([string]$BuildRoot='D:\SystemlessBuild',[string]$Source='D:\SheepShaver_MAC_Emulator\Content',[switch]$Extract,
      [string]$AdditionsManifest='', [string]$DistDirectory='', [string]$MediaDirectory='')
& "$PSScriptRoot\Build-KojiBrowser.ps1" -BuildRoot $BuildRoot -Source $Source -Extract:$Extract -Library -AdditionsManifest $AdditionsManifest -DistDirectory $DistDirectory -MediaDirectory $MediaDirectory
