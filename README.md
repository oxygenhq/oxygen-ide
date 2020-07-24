# Oxygen IDE

## Building:
1. ```npm install -g grunt-cli```
2. ```npm install```
3. ```npm run dev``` to start in development mode or ```npm run start``` in production mode.
4. ```npm run package``` to generate the release package.

## OS Specific requirements for building:

#### Windows:
* WiX Toolset installed and added to the %PATH%. 
* ```npm --add-python-to-path='true' --debug install --global windows-build-tools``` from ```cmd``` with admin rights.
* [Optional. Required for DB support] Windows SDK
* [Optional. Canvas node-rebuild] https://github.com/Automattic/node-canvas/wiki/Installation:-Windows
#### Linux
* [Optional. Required for DB support] unixodbc binaries and development libraries:  
Debian/Ubuntu - `sudo apt-get install unixodbc unixodbc-dev`  
RedHat/CentOS - `sudo dnf install unixODBC unixODBC-devel`

#### OS X
* [Optional. Required for DB support] unixodbc binaries and development libraries: `brew install unixodbc`
* [Optional. Required for notarization when packaging release builds] Set following two environment variables to your Apple ID and password:
   ```
   export APPLE_ID_USR=YOUR_APPLE_ID
   export APPLE_ID_PWD=APPLE_PASSWORD
   ```