# VivaldiHooks
[![License: WTFPL](https://img.shields.io/badge/License-WTFPL-brightgreen.svg)](http://www.wtfpl.net/about/)

## About
VivaldiHooks is a set of hooks/scripts for Vivaldi browser modding.
The main one - `jdhooks.js` - controlls mods loading and provides mod developers a way to change behaviour of Vivaldi internal components.

See Wiki for [hooks descriptions](https://github.com/justdanpo/VivaldiHooks/wiki/Hooks) or [developers' howto](https://github.com/justdanpo/VivaldiHooks/wiki/Howto-dev).

## Download
If you don't use `git` you may always download VivaldiHooks archive [here](https://github.com/justdanpo/VivaldiHooks/archive/refs/heads/master.zip).

## Installation
### Automatic (Windows only)
Just run **installhooks.bat**. It will find installation path automatically if Vivaldi is set as your default browser.

If Vivaldi is installed in "Program Files" or any other write-restricted folder, you must run the script as Administrator.

You may specify a path in a command line:

    installhooks.bat C:\programz\Vivaldi-snapshots\1.5.609.8\Application
    installhooks.bat "C:\some path with spaces\Vivaldi\Application"
    installhooks.bat -nowait C:\programz\Vivaldi-snapshots\1.5.609.8\Application

Another easy way: drag Vivaldi directory and drop it on **installhooks.bat**.

### Manual

First of all, find Vivaldi installation folder (**{instdir}**):

- Windows: `Vivaldi\Application\{version}\resources`
- Linux: `/opt/vivaldi/resources` or `/opt/vivaldi-snapshot/resources`
- MacOS: `/Applications/Vivaldi.app/Contents/Versions/{version}/Vivaldi Framework.framework/Resources`

Copy **vivaldi** folder into **{instdir}**

Or if you want to keep mods you've installed into **browser.html**, copy **vivaldi\hooks** folder and **vivaldi\jdhooks.js** into **{instdir}\vivaldi**, open **{instdir}\vivaldi\browser.html** in a text editor, add line

    <script src="jdhooks.js"></script>

right before a line with **bundle.js**.

You may need to chmod new/updated files.

## Deinstallation

If some hooks cause Vivaldi to crash, you can remove just hook files.

The easiest way to "uninstall"/disable VivaldiHooks is to delete **{instdir}\vivaldi\jdhooks.js**.

## Screenshots

### [bookmarks-button.js](vivaldi/hooks/bookmarks-button.js)

![bookmarks-button.png](screenshots/bookmarks-button.png)

### [go-button.js](vivaldi/hooks/go-button.js)

![go-button.png](screenshots/go-button.png)

### [move-window-buttons-maximized.js](vivaldi/hooks/move-window-buttons-maximized.js)

![move-window-buttons-maximized.png](screenshots/move-window-buttons-maximized.png)

### [qc-close-tab.js](vivaldi/hooks/qc-close-tab.js)

![qc-close-tab.png](screenshots/qc-close-tab.png)

### [speeddial-shortcuts.js](vivaldi/hooks/speeddial-shortcuts.js)

![speeddial-shortcuts.png](screenshots/speeddial-shortcuts.png)

### [jdhooks-startup-settings.js](vivaldi/hooks/jdhooks-startup-settings.js)

![jdhooks-startup-settings.png](screenshots/jdhooks-startup-settings.png)
