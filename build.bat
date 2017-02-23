@echo off 
call gulp version
call gulp amendSource
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder
call gulp ftp
start https://maker.ifttt.com/trigger/finder_build_complete/with/key/XXXXXX