
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
            const solutions_fname = typeof solutions === 'object' ? solutions[0] : solutions
            console.log(`${sourcedir}${type}/${solutions_fname}`)
            d3.json(`${sourcedir}${type}/${solutions_fname}`).then((json) => {
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
        if (d3.keys(allFiles).indexOf(f) === -1) {
            return undefined;
        } else {
            const fname = typeof allFiles[f] === 'object' ? allFiles[f][0] : allFiles[f];
            return d3.tsv(`${sourcedir}${type}/${fname}`);
        }        
    });
    Promise.all(toLoad).then(function(results) {
        const loadedDatasets = _.fromPairs(_.zip(files, results));
        
        execute(datasets = loadedDatasets, type = type, other_args = other_args);
    });
}