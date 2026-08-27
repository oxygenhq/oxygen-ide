# Oxygen IDE

## Building:
2. ```npm i```
3. ```npm run dev``` to start in development mode or ```npm run start``` in production mode.
4. ```npm run package``` to generate the release package.

## OS Specific requirements for building:

#### Windows:
* WiX Toolset v5 installed (`wix.exe` and the Firewall/UI/Util extensions added via `wix extension add`) and added to the %PATH%.
* Python 3 (latest) and Visual Studio Build Tools 2022 installed (to install manually: `winget install Microsoft.VisualStudio.2022.BuildTools`), with the "Desktop development with C++" workload.
* [Optional. Required for DB support] Windows SDK
* GTK and libjpeg-turbo https://github.com/Automattic/node-canvas/wiki/Installation:-Windows

#### Linux
* GTK and libjpeg-turbo:  
Debian/Ubuntu - https://github.com/Automattic/node-canvas/wiki/Installation:-Ubuntu-and-other-Debian-based-systems  
RedHat/CentOS - https://github.com/Automattic/node-canvas/wiki/Installation:-Fedora-and-other-RPM-based-distributions
* [Optional. Required for DB support] unixodbc binaries and development libraries:  
Debian/Ubuntu - `sudo apt-get install unixodbc unixodbc-dev`  
RedHat/CentOS - `sudo dnf install unixODBC unixODBC-devel`

#### macOS
* Minimum supported macOS version is macOS 12 (Monterey).
* GTK and libjpeg-turbo https://github.com/Automattic/node-canvas/wiki/Installation:-Mac-OS-X
* [Optional. Required for DB support] unixodbc binaries and development libraries: `brew install unixodbc`
* [Optional. Required for notarization when packaging release builds] Set the following environment variables to an App Store Connect API key (see "Getting an App Store Connect API key" below):
   ```
   export APPLE_API_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
   export APPLE_API_KEY_ID=XXXXXXXXXX
   export APPLE_API_ISSUER_ID=YOUR_ISSUER_ID
   ```

##### Getting an App Store Connect API key
1. Sign in at [appstoreconnect.apple.com](https://appstoreconnect.apple.com) with an account that has the Admin or Developer role on the team that owns the signing identity.
2. Go to **Users and Access** > **Integrations** tab > **Team Keys**.
3. Click the **+** button, give the key a name, and set its access to **Developer** (the minimum role notarization needs).
4. Download the generated `.p8` file immediately — Apple only lets you download it once. Store it somewhere safe on the build machine and point `APPLE_API_KEY_PATH` at it.
5. Note the **Key ID** shown next to the key in the list — that's `APPLE_API_KEY_ID`.
6. Note the **Issuer ID** shown at the top of the Integrations page — that's `APPLE_API_ISSUER_ID`.