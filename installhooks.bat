@echo off
::try path from commandline
if not "%~1a"=="a" set vivaldipath=%~1
::search vivaldi in associations
if "%vivaldipath%"a==""a for /f "tokens=2* delims==" %%i in ('ftype ^| find /i "vivaldi.exe"') do call :getpath %%i
::search vivaldi in the registry
if "%vivaldipath%"a==""a for /f "usebackq skip=2 tokens=2,*" %%i in (`reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\vivaldi.exe" /v Path`) do set vivaldipath=%%~j

if "%vivaldipath%"a==""a (
  echo Cannot find Vivaldi.exe
  exit /b 1
)

for /F %%i in ('dir /b /od "%vivaldipath%" ^| findstr ^[0-9][0-9]*.') do if exist "%vivaldipath%\%%i\resources\vivaldi\bundle.js" set latest=%%i

if %latest%a==a (
  echo Cannot find Vivaldi version
  exit /b 1
)

echo Vivaldi path="%vivaldipath%", version=%latest%

set browserhtml="%vivaldipath%\%latest%\resources\vivaldi\browser.html"
set tmpfilename="%vivaldipath%\%latest%\resources\vivaldi\tmpbrowser.html"
if exist %tmpfilename% del %tmpfilename%

xcopy /e /y /i "vivaldi" "%vivaldipath%\%latest%\resources\vivaldi" > nul

echo ok
goto :eof

:getpath
if exist "%~f1" set vivaldipath=%~dp1
