#!/bin/bash

cd $(dirname $0)

mkdir -p /Library/Google/Chrome/NativeMessagingHosts
cp ox.native.messanger.json /Library/Google/Chrome/NativeMessagingHosts
