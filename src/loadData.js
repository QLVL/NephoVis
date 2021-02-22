
// var type = getUrlParameter(window.location, "type");
function loadData(type, files, other_args = null) {
    const sourcedir = "tokenclouds/data/"
    
    fetch (`${sourcedir}${type}/paths.json`).then(response => {
        if (!response.ok) {
            window.alert("Please add a 'paths.json' file listing your available files!");
            return "";
        } 
        return response.json();
    }).then(data => {
        const { solutions } = data;
        if (files.indexOf("tokens") > -1 && solutions === undefined){
            data["unique"] = `${sourcedir}${type}/${type}.tsv`;
            other_args = ["unique"];
        }
        if (files.indexOf("focdists") > -1 && solutions === undefined){
            data["unique"] = `${sourcedir}${type}/${type}.cws.tsv`;
        }

        if (solutions !== undefined){
            console.log(`${sourcedir}${type}/${solutions[0]}`)
            d3.json(`${sourcedir}${type}/${solutions[0]}`).then((json) => {
                if (files.indexOf("tokens") > -1) {
                    d3.keys(json).forEach(d => files.push(d));
                    if (other_args === null) other_args = d3.keys(json);
                    _.pull(files, "tokens");
                }
                if (files.indexOf("focdists") > -1) {
                    d3.keys(json).forEach(d => { if (d3.keys(data).indexOf(`${d}cws`) > -1) files.push(`${d}cws`); });
                    _.pull(files, "focdists");
                }
                retrieveFiles(sourcedir, files, data, type, other_args);
            });
            
        } else {
            retrieveFiles(sourcedir, files, data, type, other_args);
        }
        
    });
}

function retrieveFiles(sourcedir, files, allFiles, type, other_args){
    console.log(other_args)
    const toLoad = files.map(f => {
        return d3.keys(allFiles).indexOf(f) > -1
        ? d3.tsv(`${sourcedir}${type}/${allFiles[f][0]}`)
        : undefined;
    });
    Promise.all(toLoad).then(function(results) {
        const loadedDatasets = _.fromPairs(_.zip(files, results));
        
        execute(datasets = loadedDatasets, type = type, other_args = other_args);
    });
}