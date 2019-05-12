@echo off

set LOG=C:\host-log-2.txt

time /t >> %LOG%

"%~dp0node.exe" "%~dp0my_host_2.js" %* 2>> %LOG%

echo %errorlevel% >> %LOG%
