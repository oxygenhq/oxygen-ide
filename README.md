# Oxygen IDE

## Building:
1. ```npm install -g grunt-cli```
2. ```npm install```
3. ```npm run dev``` to start in development mode or ```npm run start``` in production mode.
4. ```cd tools && ./build``` on Linux or OS X to generate the release package or ```cd tools && build``` on Windows.

## OS Specific requirements for building:

#### Windows:
* WiX Toolset installed and added to the %PATH%. 
* ```npm --add-python-to-path='true' --debug install --global windows-build-tools``` from windows power shell with admin rights.
* [Optional.  Required for DB support] Windows SDK

#### Linux
* [Optional.  Required for DB support] unixodbc binaries and development libraries:  
Debian/Ubuntu - `sudo apt-get install unixodbc unixodbc-dev`  
RedHat/CentOS - `sudo dnf install unixODBC unixODBC-devel`

#### OS X
* [Optional.  Required for DB support] unixodbc binaries and development libraries: `brew install unixodbc`
