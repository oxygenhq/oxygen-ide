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
* [Optional.  Required for DB support] Windows SDK

#### Linux
* [Optional.  Required for DB support] unixodbc binaries and development libraries:  
Debian/Ubuntu - `sudo apt-get install unixodbc unixodbc-dev`  
RedHat/CentOS - `sudo dnf install unixODBC unixODBC-devel`

#### OS X
* [Optional.  Required for DB support] unixodbc binaries and development libraries: `brew install unixodbc`


#### OS X NEW
0) sudo npm run dist
1) cd dist
2) pkgutil --expand OxygenIDE-1.5.0.pkg some_folder - It will create folder with unpacked .pkg to folder with name 'oxygen.ide.pkg' and 'Distribution' file, whitch need to change

3) add code after <title> tag


    <options allow-external-scripts="yes"/>
    <installation-check script="CustomInstallationCheck();"/>
    <script>
        function CustomInstallationCheck()
        {
            try{

                rcScript2 = system.run('preinstall.sh');
                result2 = (rcScript2 != 0);
                var log2 = "2 system.run /bin/sh .. returned: " + rcScript2 + " result=" + result2;
                system.log('2');
                system.log(log2);

                rcScript = system.run('preinstall');
                result = (rcScript != 0);
                var log = "system.run1 /bin/sh .. returned: " + rcScript + " result=" + result;
                system.log('1');
                system.log(log);

                my.result.title = system.localizedString(log2);
                my.result.message = system.localizedString(log);
                my.result.type = 'Fatal';
                return false; 


                if(result){
                    my.result.title = system.localizedString(log2);
                    my.result.message = system.localizedString(log);
                    my.result.type = 'Fatal';
                    return false; 
                } else {
                    my.result.title = system.localizedString('Bad Java version');
                    my.result.message = system.localizedString('Java version must be between 8 and 10');
                    my.result.type = 'Fatal';
                    return false; 
                }

            } catch (e) { 
                system.log('e'); 
                system.log(e); 

                my.result.title = system.localizedString('Error when try to know java version');
                my.result.message = system.localizedString(e);
                my.result.type = 'Fatal';

                return false; 
            }
        }
    </script>

4) pkgutil --flatten oxygen.ide.pkg oxygen.idef.pkg

5) in Distribution set pkg-ref to oxygen.idef.pkg

6) productbuild --resources a --scripts a --distribution Distribution oxygenwithcheck.pkg


(js doc https://developer.apple.com/documentation/installerjs)
(install from console 'sudo installer -pkg oxygenwithcheck.pkg -target / ')