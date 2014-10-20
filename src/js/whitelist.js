/*******************************************************************************

    µBlock - a Chromium browser extension to block requests.
    Copyright (C) 2014 Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

/* global vAPI, uDom */
'use strict';

/******************************************************************************/

(function() {

/******************************************************************************/

var messager = vAPI.messaging.channel('whitelist.js');

/******************************************************************************/

var cachedWhitelist = '';

// Could make it more fancy if needed. But speed... It's a compromise.
var reUnwantedChars = /[\x00-\x09\x0b\x0c\x0e-\x1f!"#$'()<>{}|\\^\[\]`~]/;

/******************************************************************************/

var whitelistChanged = function() {
    var s = uDom('#whitelist').val().trim();
    var bad = reUnwantedChars.test(s);
    uDom('#whitelistApply').prop(
        'disabled',
        s === cachedWhitelist || bad
    );
    uDom('#whitelist').toggleClass('bad', bad);
};

/******************************************************************************/

var renderWhitelist = function() {
    var onRead = function(whitelist) {
        cachedWhitelist = whitelist;
        uDom('#whitelist').val(cachedWhitelist);
    };
    messager.send({ what: 'getWhitelist' }, onRead);
};

/******************************************************************************/

var handleImportFilePicker = function() {
    var fileReaderOnLoadHandler = function() {
        var textarea = uDom('#whitelist');
        textarea.val([textarea.val(), this.result].join('\n').trim());
        whitelistChanged();
    };
    var file = this.files[0];
    if ( file === undefined || file.name === '' ) {
        return;
    }
    if ( file.type.indexOf('text') !== 0 ) {
        return;
    }
    var fr = new FileReader();
    fr.onload = fileReaderOnLoadHandler;
    fr.readAsText(file);
};

/******************************************************************************/

var startImportFilePicker = function() {
    var input = document.getElementById('importFilePicker');
    // Reset to empty string, this will ensure an change event is properly
    // triggered if the user pick a file, even if it is the same as the last
    // one picked.
    input.value = '';
    input.click();
};

/******************************************************************************/

var exportWhitelistToFile = function() {
    var val = uDom('#whitelist').val().trim();

    if (val) {
        vAPI.download({
            'url': 'data:text/plain,' + encodeURIComponent(val),
            'filename': 'my-ublock-whitelist.txt'
        });
    }
};

/******************************************************************************/

var whitelistApplyHandler = function() {
    cachedWhitelist = uDom('#whitelist').val().trim();
    var request = {
        what: 'setWhitelist',
        whitelist: cachedWhitelist
    };
    messager.send(request);
    whitelistChanged();
};

/******************************************************************************/

uDom.onLoad(function() {
    uDom('#importWhitelistFromFile').on('click', startImportFilePicker);
    uDom('#importFilePicker').on('change', handleImportFilePicker);
    uDom('#exportWhitelistToFile').on('click', exportWhitelistToFile);
    uDom('#whitelist').on('input', whitelistChanged);
    uDom('#whitelistApply').on('click', whitelistApplyHandler);

    renderWhitelist();
});

/******************************************************************************/

})();
