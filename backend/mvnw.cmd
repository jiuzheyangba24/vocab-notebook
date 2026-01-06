@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.
@REM ----------------------------------------------------------------------------

@echo off
@setlocal

set WRAPPER_VERSION=3.2.0
set WRAPPER_JAR="%~dp0\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%~dp0\.mvn\wrapper\maven-wrapper.properties"

@REM Check for Maven Wrapper jar
if not exist %WRAPPER_JAR% (
    echo Downloading Maven Wrapper...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar' -OutFile '%~dp0\.mvn\wrapper\maven-wrapper.jar'}"
)

@REM Download Maven if needed
if not exist "%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6" (
    echo Maven not found, downloading...
)

@REM Find java.exe
set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
exit /b 1

:execute
"%JAVA_EXE%" -jar %WRAPPER_JAR% %*

:end
@endlocal
