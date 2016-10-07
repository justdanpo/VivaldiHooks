# VivaldiHooks

##About
VivaldiHooks is a set of hooks/scripts for Vivaldi browser modding.

It's something close to [VivaldiPatches](https://github.com/justdanpo/VivaldiPatches) but it has some advantages:

- there is no need to add every mod (css/javascript) into **browser.html**: only **jdhooks.js** should be added there, other files are loaded automatically
- hook scripts are almost Vivaldi-version independent -> there is no need to port mods to every new Vivaldi version
- there is no need to interact with minified code; this means more complex mods may be done easier; also javascript mods look much more readable than patches

##Installation
###Automatic (Windows only)
Just run **installhooks.bat**. It will find installation path automatically if Vivaldi is set as your default browser.

If Vivaldi is installed in "Program Files" or any other write-restricted folder, you must run the script as Administrator.

You may specify a path in a command line:

    installhooks.bat C:\programz\Vivaldi-snapshots\1.5.609.8\Application
    installhooks.bat "C:\some path with spaces\Vivaldi\Application"

Note: **browser.html** will be overwritten.
###Manual
Copy **vivaldi** folder into **Vivaldi\Application\{version}\resources**

Or if you want to keep mods you've installed into **browser.html**, copy **vivaldi\hooks** folder and **vivaldi\jdhooks.js** into **Vivaldi\Application\{version}\resources\vivaldi**, open **Vivaldi\Application{version}\resources\vivaldi\browser.html** in a text editor, add line

    <script src="jdhooks.js"></script>

right before a line with **bundle.js**.

##Screenshots

### [bookmarks-button.js](vivaldi/hooks/bookmarks-button.js)

![bookmarks-button.png](screenshots/bookmarks-button.png)

### [extensions-buttons-menu-settings.js](vivaldi/hooks/extensions-buttons-menu-settings.js)

![extensions-buttons-menu-settings.png](screenshots/extensions-buttons-menu-settings.png)

### [go-button.js](vivaldi/hooks/go-button.js)

![go-button.png](screenshots/go-button.png)

### [move-window-buttons-maximized.js](vivaldi/hooks/move-window-buttons-maximized.js)

![move-window-buttons-maximized.png](screenshots/move-window-buttons-maximized.png)

### [qc-close-tab.js](vivaldi/hooks/qc-close-tab.js)

![qc-close-tab.png](screenshots/qc-close-tab.png)

### [search-selected.js](vivaldi/hooks/search-selected.js)

![search-selected.png](screenshots/search-selected.png)

### [speeddial-shortcuts.js](vivaldi/hooks/speeddial-shortcuts.js)

![speeddial-shortcuts.png](screenshots/speeddial-shortcuts.png)

### [zoom-buttons.js](vivaldi/hooks/zoom-buttons.js)

![zoom-buttons.png](screenshots/zoom-buttons.png)

### [searchfield-current-engine-icon.js](vivaldi/hooks/searchfield-current-engine-icon.js)

![searchfield-current-engine-icon.png](screenshots/searchfield-current-engine-icon.png)

### [devtools.js](vivaldi/hooks/devtools.js)

![devtools.png](screenshots/devtools.png)
