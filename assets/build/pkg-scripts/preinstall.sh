#!/bin/sh
#This is a sample preinstall or postinstall script.
#Your logic goes here.
#if [ your_logic_returns_false ]
#then
#     exit -1
#fi
#exit 0
if type -p java; then
    echo found java executable in PATH
    _java=java
elif [[ -n "$JAVA_HOME" ]] && [[ -x "$JAVA_HOME/bin/java" ]];  then
    echo found java executable in JAVA_HOME     
    _java="$JAVA_HOME/bin/java"
else
    echo "no java"
    exit -2
fi

if [[ "$_java" ]]; then
    version=$("$_java" -version 2>&1 | awk -F '"' '/version/ {print $2}')
    echo version "$version"
    if [[ "$version" > "8" ]] && [[ "$version" > "10" ]]; then
        echo version is correct
        exit 0
    else         
        echo version is incorect
        exit -3
    fi
else
    exit -4
fi