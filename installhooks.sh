#!/bin/sh

cp vivaldi/jdhooks.js /opt/vivaldi/resources/vivaldi/jdhooks.js
cp -r vivaldi/hooks /opt/vivaldi/resources/vivaldi/hooks

if ! grep -q "jdhooks.js" browser.html; then
	sed -i '/src="bundle.js"/i \ \ \ \ <script src="jdhooks.js"></script>' browser.html
fi
