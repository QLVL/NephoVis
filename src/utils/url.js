/* Interactive visualization of token-level distributional models
Copyright (C) 2021  Thomas Wielfaert and Mariana Montes - QLVL, KU Lueven

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>. */

function getUrlParameter(sLocation, sParam) {
    console.debug('getUrlParameter: ', { sLocation, sParam });
    return getQueryStringParameter(sLocation.search, sParam);
}

function getQueryStringParameter(querystring, sParam) {
    console.debug('getQueryStringParameter: ', { querystring, sParam });
    var sPageURL = decodeURIComponent(querystring.substring(1)),
        sURLVariables = sPageURL.split("&"),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split("=");
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

function capitalize(string){
    return(string.slice(0, 1).toUpperCase() + string.slice(1))
}

// Hard code paths
function hcpaths(args = 'dir'){
    const sourcedir = "tokenclouds/data/";
    const lemmas_register = 'euclidean_register.tsv'; // For posIndex.html line 83
    if (args === 'dir') {
        return(sourcedir);
    } else if (args == 'register') {
        return(sourcedir + lemmas_register);
    } else {
        return;
    }
}