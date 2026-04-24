@REM Maven Wrapper script for Windows
@REM Downloaded Maven Wrapper from https://maven.apache.org/wrapper/
@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties
set MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar

if not exist "%MAVEN_WRAPPER_JAR%" (
    echo Downloading Maven wrapper...
    for /f "tokens=1,* delims==" %%a in ('findstr /r "wrapperUrl" "%MAVEN_WRAPPER_PROPERTIES%"') do set WRAPPER_URL=%%b
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%MAVEN_WRAPPER_JAR%'"
)

set MAVEN_CMD_LINE_ARGS=%*

for /f "tokens=1,* delims==" %%a in ('findstr /r "distributionUrl" "%MAVEN_WRAPPER_PROPERTIES%"') do set DIST_URL=%%b

set MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo Downloading Maven distribution...
    set ZIP_FILE=%TEMP%\maven-dist.zip
    powershell -Command "Invoke-WebRequest -Uri '%DIST_URL%' -OutFile '%ZIP_FILE%'"
    powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%USERPROFILE%\.m2\wrapper\dists' -Force"
)

"%MAVEN_HOME%\bin\mvn.cmd" %MAVEN_CMD_LINE_ARGS%
