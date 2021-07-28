# Oxygen IDE

## Building:
1. ```npm install -g grunt-cli```
2. ```npm install```
3. ```npm run dev``` to start in development mode or ```npm run start``` in production mode.
4. ```npm run package``` to generate the release package.

## OS Specific requirements for building:

#### Windows:
* WiX Toolset installed and added to the %PATH%. 
* Python 2.7 and VS Studio 2019 installed manually or ```npm --add-python-to-path='true' --debug install --global windows-build-tools``` from ```cmd``` with admin rights.
* [Optional. Required for DB support] Windows SDK
* GTK and libjpeg-turbo https://github.com/Automattic/node-canvas/wiki/Installation:-Windows

#### Linux
* GTK and libjpeg-turbo:  
Debian/Ubuntu - https://github.com/Automattic/node-canvas/wiki/Installation:-Ubuntu-and-other-Debian-based-systems  
RedHat/CentOS - https://github.com/Automattic/node-canvas/wiki/Installation:-Fedora-and-other-RPM-based-distributions
* [Optional. Required for DB support] unixodbc binaries and development libraries:  
Debian/Ubuntu - `sudo apt-get install unixodbc unixodbc-dev`  
RedHat/CentOS - `sudo dnf install unixODBC unixODBC-devel`

#### OS X
* GTK and libjpeg-turbo https://github.com/Automattic/node-canvas/wiki/Installation:-Mac-OS-X
* [Optional. Required for DB support] unixodbc binaries and development libraries: `brew install unixodbc`
* [Optional. Required for notarization when packaging release builds] Set following two environment variables to your Apple ID and password:
   ```
   export APPLE_ID_USR=YOUR_APPLE_ID
   export APPLE_ID_PWD=APPLE_PASSWORD
   ```