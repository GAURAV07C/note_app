@ECHO OFF
SET JEST_NO_COLOR=1
SET FORCE_COLOR=0
CALL npx jest --verbose --no-cache --testPathPattern "dummy" --runInBand 2>&1
ECHO EXIT: %ERRORLEVEL%
