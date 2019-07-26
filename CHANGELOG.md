# CHANGELOG

## v1.8.0 (2019-07-xx)
* Fix breakpoints to work with nested files.
* Allow setting/removing breakpoint after the test has been already started.
* Allow setting breakpoints in unsaved files.
* Fix possible crash when synchronizing files.
* Do not allow starting recording while test is running.
* Fix switching between local and Sauce Labs mode.
* Fix crash when running certain nested tests.
* Fix mouse scroll wheel occasionally performing zoom-in/out instead of scrolling.
* Notarize OS X builds.
* Scroll log window when new content is added.
* Bump Oxygen 0.47.0

## v1.7.0 (2019-07-14)
* [BREAKING] Oxygen IDE requires now Chrome Oxygen Extension v0.64.0 or later.
* Fixed an issue with Run button being disabled when recording stopped abruptly.
* Fixed an issue with externally removed files remaining in the IDE in unusable state.
* Fixed issue when recording into temporary files.
* Highlight currently active file used for recording.
* Highlight 'Continue' button when reaching a breakpoint.
* Don't show error if automatic update check has failed.
* Fixed number of issues with breakpoints and run marker.
* Add support for Sauce Labs provider.
* Add support for monitoring of iOS devices.
* Bump Oxygen 0.46.4.

## v1.6.0 (2019-06-21)
* Fixed saving recording in a wrong file format deletes the script.
* Fixed increasing font size does not increase green arrow & red break point.
* Fixed crash when working in offline mode.
* Fixed run marker not disappearing when test completes successfully.
* Bump IEDriverServer 1.141.59.
* Bump Oxygen 0.45.1.

## v1.5.1 (2019-05-29)
* Bump Oxygen 0.44.0.
* Fixed `log` commands not working.
* Fixed empty files being incorectly saved.
* Fixed saving newly created files not working in OS X.
* Fixed test execution not working on OS X and Linux.
* Fixed IDE crash when opened folder is located on a network drive.
* Other fixes & improvements.

## v1.5.0 (2019-05-20)
* Bump Oxygen 0.42.8.
* Better synchronization for files and directories modified outside the IDE.
* Landing screen.
* UIX improvements to the recording process.
* Reworked file creation process.
* Preserve unsaved changes across IDE restarts.
* Check for Java installation.
* MSI installer improvements.
* Anonymous analytics.
* Other fixes & improvements.

## v1.4.0 (2019-03-04)
* Bump Oxygen 0.42.0.
* Bump Geckodriver 0.24.0.
* Bump IEDriverServer 1.141.5.
* Bump Chromedriver 2.46.0.
* Allow to set and pause on breakpoints in module files (called by require from the main script).
* Add more user hints for some script execution errors.
* Add button for copying general/selenium log content to clipboard.
* Automatically synchronize file hierarchy and content when files are modified outside of the IDE.
* Add 'go professional' menu entry.
* Prevent script editing during execution.
* Don't allow creating folders files with illegal characters in their names.
* Add option to change editor's font size.
* Add support for drag-and-drop inside the file tree.
* Changed 'modified' tab icon.
* Update recorder certificates.
* Print more error details on 'Test Failed' errors.
* Show message about unsaved file as a warning instead of error.
* Improve welcome message.
* Fix selenium process getting killed when opening two instances of the IDE.
* Fix crash in create file dialog when filename is not specified.
* Fix general log scrolling issues.
* Fix tab scroller appearing in the middle of the tabs and not in the bottom of the tabs.

## v1.3.1 (2019-01-03)
* Bump Oxygen 0.39.0.
* Colorize transaction commands.
* Fix active line not always pointing to the correct line on bp events.
* Fix breakpoints disappearing in certain situations.
* Fix method descriptions in intellisense suggestions.
* Show formated text in logs.

## v1.3.0 (2018-12-23)
* Bump Oxygen 0.38.0.
* Bump ChromeDriver 2.45.
* Bump IEDriverServer 3.141.0.
* Fix IDE not responding when opened folder gets deleted outside of the IDE.
* Write proper status to log when test is canceled.
* Display notification messages slightly below the toolbar.
* Fix breakpoint markers disappearing in certain situations.
* Fix crash when running multiple iterations with breakpoints.

## v1.2.0 (2018-12-02)
* ...

## v1.1.0 (2018-11-20)
* ...

## v1.0.0 (2018-11-15)
* Initial next-gen release. Everything is new!
