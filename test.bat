@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
  set "JAVA_HOME=C:\Program Files\Java\jdk-17"
) else if exist "C:\Program Files\Java\latest\bin\java.exe" (
  set "JAVA_HOME=C:\Program Files\Java\latest"
) else (
  echo Could not find a JDK under C:\Program Files\Java
  exit /b 1
)

set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

cd /d "%SCRIPT_DIR%frontend"
npx expo run:android --port 8084
