
// var type = getUrlParameter(window.location, "type");
function loadData(type, files, other_args = null) {
    
    var allFiles = {
        "model" : "data/" + type + "/" + type + ".models.tsv",
        "distances" : "data/" + type + "/" + type + ".models.dist.tsv",
        "tokens" : "data/" + type + "/" + type + ".tsv",
        "weights" : "data/" + type + "/" + type + ".ppmi.tsv",
        "variables" : "data/" + type + "/" + type + ".variables.tsv",
        "medoids" : "data/" + type + "/" + type + ".medoids.tsv"
    };

    fetch("data/" + type + "/" + type + ".solutions.json").then(response => {
        if (!response.ok) {
            return "";
        }
        return response.json();
        }).then(data => {
            if (files.indexOf("tokens") > -1) {
                const solutions = d3.keys(data).length > 0 ? d3.keys(data) : ["unique"];
                solutions.forEach(function(d) {
                    const suffix = d === "unique" ? "" : data[d];
                    allFiles[d] = "data/" + type + "/" + type + suffix + ".tsv";
                    if (files.indexOf("focdists") > -1) {
                        allFiles[d + ".cws"] = "data/" + type + "/" + type + suffix + ".cws.tsv";
                        files.push(d + ".cws");
                    }
                    files.push(d);
                });
                _.pull(files, "tokens"); _.pull(files, "focdists")
                if (other_args === null) other_args = solutions;
            }
            if (files.indexOf("medoids") !== -1) {
                fetch(allFiles.medoids).then((response) => {
                    if (!response.ok) {
                        _.pull(files, "medoids");
                    }
                    if (files.indexOf("mds.cws") !== -1) {
                        fetch(allFiles["mds.cws"]).then((response) => {
                            if (!response.ok) {
                                _.pull(files, [...files.map((d) => d.endswith("cws"))])
                            }
                            retrieveFiles(files, allFiles, type, other_args);
                        })
                    } else {
                        retrieveFiles(files, allFiles, type, other_args);
                    }
                    
                });
            } else {
                
            console.log(files)
            console.log(allFiles)
                retrieveFiles(files, allFiles, type, other_args);
            }
        });
    
}

function retrieveFiles(files, allFiles, type, other_args){
    toLoad = files.map(function(f) {return(d3.tsv(allFiles[f])); });
    
    Promise.all(toLoad).then(function(results) {
        const loadedDatasets = _.fromPairs(_.zip(files, results));
        
        execute(datasets = loadedDatasets, type = type, other_args = other_args);
    });
}