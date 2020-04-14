# CHANGELOG

## v1.17.0 (2020-04-15)

#### :beetle: Bug Fix
* Wrong current line indication when breakpoint is set on commented line.
* `log.*` output not being displayed in the log panel.
* Number of issues with browser disposal.
* Various issues with running tests on LambdaTest and SauceLabs providers.

#### :house: Internal
* Bumped oxygen-cli from v1.1.3 to v1.2.0. See [Oxygen ChangeLog](https://github.com/oxygenhq/oxygen/blob/master/CHANGELOG.md).
* Update bundled ChromeDriver 81.
* Update bundled GeckoDriver for Linux and OS X to v0.26.0.

## v1.16.0 (2020-03-15)

#### :tada: New Feature
* Significantly improved installation speed on Windows and reduced package size for all platforms.

#### :beetle: Bug Fix
* Number of issues in editor introduced in v1.15.0.
* No default browser/devices selected when switching between web, mobile, and responsive modes.

#### :house: Internal
* Bumped oxygen-cli from v1.1.2 to v1.1.3. See [Oxygen ChangeLog](https://github.com/oxygenhq/oxygen/blob/master/CHANGELOG.md).

## v1.15.0 (2020-03-11)

#### :boom: Breaking Change
* Bumped minimum supported macOS version to 10.10.

#### :beetle: Bug Fix
* Crash on test end under certain conditions.
* Processing of CSV files with spaces in the header.
* SauceLabs test execution not working.
* Local Appium was used during mobile test execution on cloud providers.
* If opened folder was renamed outside of the IDE, Open Folder button stopped working.
* Other small fixes & improvements.

#### :house: Internal
* Bumped oxygen-cli from v1.0.2 to v1.1.2. See [Oxygen ChangeLog](https://github.com/oxygenhq/oxygen/blob/master/CHANGELOG.md).
* Updated pre-bundled Chrome drivers.
* Bumped and cleaned-up dependencies.

#### :studio_microphone: Chrome Extension (v0.72.0)
* Fixed issue with website hanging under certain conditions when trying to generate CSS selector.
* Do not pollute website's message event handlers with recorder messages.

## v1.14.1 (2020-02-13)

#### :beetle: Bug Fix
* Windows version not working properly when project's folder is located on a network drive.
* Linux related fixes.
* ChromeDriver update mechanism not working.
* Invalid video tutorials links in welcome page.
* IDE sometimes freezing when stopping tests.

#### :house: Internal
* Bump oxygen-cli from v1.0.1 to v1.0.2. See [Oxygen ChangeLog](https://github.com/oxygenhq/oxygen/blob/master/CHANGELOG.md).

## v1.14.0 (2020-02-06)

#### :tada: New Feature
* Significant improvements to test structure organization, allowing to define all configurations using a project file.
* Improvements to the script development flexibility:  
  - Automation tests can be written using ES6.
  - Tests can hook into exposed `before` and `after` hooks for `test`, `suite`, `case`, `command` actions.
* Improvements to Oxygen extendability:  
  - Internal modules can be written using ES6 and can be developed in both synchronous and asynchronous (using `async/await` operators) manner.  
  - Modules can contain submodules. E.g. `web.network.assertUrl`.
  - Added support for Service. Services are add-ons which can be developed for providing additional custom logic for tests.
* Support for Applitools for visual UI testing.
* Support for native Windows applications (via WinApiDriver) automation - WinForms, WPF, UWP, Classic Win32.
* Support for writing tests using Cucumber.
* Support for environment variables.
* Project level Page Object support.
* Support for running multiple Suites as a part of a single test.
* Improved debugging support when using breakpoints in external files.
* Added `web.rightClick`.
* Added `win.rightClick`.
* Improvements to SauceLabs, LambdaTest, TestingBot integrations.
* `pdf` methods accept optional argument for reversing string order (useful when working with RTL languages).

#### :boom: Breaking Change
* `ox.*` is no longer available. `ox.modules.*` should be used instead. All available modules `web`, `mob`, etc are also exposed globally now and can be used directly.
* `return` is no longer supported for terminating user scripts.
* Suite configuration JSONs are no longer supported. Project level configuration files should be used instead.
* `web.network*` commands are now accessible via a submodule `web.network.*` and have different names. See documentation for more details.

#### :beetle: Bug Fix
* `twilio` not producing proper error when no matching messages found.
* `web.network` not recording responses for redirected requests.
* `web.click` not working on IE under certain conditions.
* Debugger not entering into module code if module name is specified using wrong case.
* Crash when launching the IDE under certain situations.
* Relative paths not working in `pdf` module.
* Folder being duplicated sometimes when creating new folders.

#### :nail_care: Polish
* Improved error handling. Errors now contain proper stacktraces and provide more details about where in user script the error has occurred.
* More errors from underlying frameworks are handled and processed.
* JUnit XML reports improved to include more details about test failures.
* `twilio` module performance improvements.
* Added JS injection fall-back for `web.doubleClick` when element is not clickable.

#### :book: Documentation
* Documentation has been migrated to a new infrastructure providing better user experience. Documentation has been, as well, improved with more topics.

#### :house: Internal
* Webdriverio updated to v5.18.6.
* Updated pre-bundled Chrome drivers.

## v1.12.1 (2019-11-27)

#### :tada: New Feature
* Support for variables inspection in debugging mode.

#### :beetle: Bug Fix
* "Do not show this message again" checkbox not working in recording dialog.
* Newly created files not showing in the file tree under some circumstances.
* A number of Object Repository UI issues.

#### :house: Internal
* Update bundled ChromeDriver 78.
* Bump oxygen-cli from v0.51.0 to v0.52.2. See [Oxygen ChangeLog](https://github.com/oxygenhq/oxygen/blob/master/CHANGELOG.md).

#### :studio_microphone: Chrome Extension (v0.70.0)
* Fix XPath construction when nodes have identical siblings.
* Fix CSS locator generation.
* Lower link locator precedence since it fails when element is out of the viewport.
* Fix recording when running in simulated mobile mode.
* Do not record changes on readonly input elements.

## v1.11.0 (2019-10-28)

#### :tada: New Feature
* Add `build` property to LambdaTest provider settings.

#### :beetle: Bug Fix
* Unable to create nested folders.
* Opened file content not being restored properly if the file was modified outside the IDE.
* Issue with Firefox tests not working on Windows machines which don't have MSVC installed.
* Unable to create new folders at the root of the currently opened location.
* Recording button not working if Chrome is launched after the IDE.
* Various other fixes.

#### :nail_care: Polish
* Various Object Repository UI improvements.
* Warn if iOS device discovery fails due to `xcrun -find instruments` failure.

#### :house: Internal
* Bump Chokidar (should reduce memory consumption and improve responsiveness)
* Bundle ChromeDriver 78.
* Bump oxygen-cli from v0.48.5 to v0.51.0. See [Oxygen ChangeLog](https://github.com/oxygenhq/oxygen/blob/master/CHANGELOG.md).

## v1.10.0 (2019-09-26)

#### :tada: New Feature
* Added support for LambdaTest cloud provider.
* New web commands: `web.isSelected`
* New mob commands: `mob.closeApp`, `mob.installApp`, `mob.removeApp`, `mob.launchApp`, `mob.resetApp`, `mob.getCurrentAcitivity`, `mob.getCurrentPackage`
* New pdf commands: `pdf.count`
* Optional `pageNum` argument for `pdf.assert` and `pdf.assertNot`.
* Optional `timeout` argument for all `mob` and `web` commands. Can be used to set timeouts per command.
* Optional `clickParent` argument for `web.clickHidden`.

#### :boom: Breaking Change
* `mob.verifyTitle`, `mob.verifyTitle`, `mob.verifyValue` removed since those command worked exactly like their `assert*` counterparts.
* `mob.swipe` has been split into two separate commands: `mob.swipe` and `mob.swipeScreen`.
* `mob.hideKeyboard` accepts different arguments and supports more strategies.
* `mob.scrollToElement` accepts different arguments.
* `mob.setAutoWait` and `web.setAutoWait` removed.
* Optional `message` argument has been removed from relevant `mob` commands.

#### :beetle: Bug Fix
* Recorder turning off sporadically.
* Not all commands being recorded sometimes.
* CSVs produced by Excel on OS X couldn't be used.
* `web.makeVisible` will keep the original element dimensions if non 0.
* Copying log to clipboard wasn't preserving the line breaks.
* Duplicate line indicator appearing under certain conditions.

#### :nail_care: Polish
* Error handling has been significantly improved.
* Show both XLSX and CSV file types in parameters file browser by default.
* Display currently opened folder path in save dialog.
* Remove deprecated Amazon Kindle Fire HDX from responsive mode targets list.

#### :book: Documentation
* Various documentation fixes.

#### :house: Internal
* WebDriverIO v5.
* Bump dependencies.
* Update bundled ChromeDriver v76 and v77.
* Update IEDriverServer 3.150.0.
* Update GeckoDriver 0.25.0.

#### :studio_microphone: Chrome Extension (v0.69.0)
* Fixed invalid selectWindow title being recorded in certain situations.
* Fixed recording of alerts, confirmation, and prompt dialogs.

## v1.9.0 (2019-08-19)
* Added TestingBot as cloud provider [on behalf of jochen].
* Prevent crash when relaunching the IDE while it's already running in the background.
* Fixed not being able to remove breakpoints from empty lines.
* Bundle ChromeDriver v77.
* Other minor fixes.

## v1.8.0 (2019-08-07)
* Added mechanism for ChromeDriver version management.
* Allow setting/removing breakpoint after the test has been already started.
* Allow setting breakpoints in unsaved files.
* Scroll log window when new content is added.
* Do not allow starting recording while test is running.
* Fixed breakpoints to work with nested files.
* Fixed number of issues related to file synchronization.
* Fixed switching between local and Sauce Labs mode.
* Fixed crash when running certain nested tests.
* Fixed mouse scroll wheel occasionally performing zoom-in/out instead of scrolling.
* Fixed Java check during startup.
* Fixed handling of invalid parameters files.
* Fixed rare crash when executing tests due to debugger port being unavailable.
* Fixed crash when executing unsaved file on OS X under certain conditions.
* Notarize OS X builds. Prevents security warnings on OS X 10.14.4 and later.
* Bump Oxygen 0.47.2

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
