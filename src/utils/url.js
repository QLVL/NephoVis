
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