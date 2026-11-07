@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Start-MacGames.ps1" -Stop
if errorlevel 1 pause
