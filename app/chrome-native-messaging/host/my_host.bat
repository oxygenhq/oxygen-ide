@echo off

set LOG=C:\host-log.txt

time /t >> %LOG%

"%~dp0node.exe" "%~dp0my_host.js" %* 2>> %LOG%

echo %errorlevel% >> %LOG%
