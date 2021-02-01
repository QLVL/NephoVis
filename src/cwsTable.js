function countTokens(cw, df, cwsColumns) {
    let res = []
    for (let i = 0; i < cwsColumns.length; i++){
        const m = cwsColumns[i];
        const tids = df
            .filter((t) => t[m].split(";").indexOf(cw) !== -1 )
            .map((t) => t["_id"] );
        res.push(...tids);
    }
    return(_.uniq(res).length);
}

function countCws(m, cw, df) {
    const res = df.map((d) => d[m])
        .join(";").split(";")
        .filter((w) => w === cw );
    return (res.length);
}

function createModelCT(m, cw, selectedTokens, deselectedTokens){
    const inModel = selectedTokens.map((d) => d[m]);
    const notInModel = deselectedTokens.map((d) => d[m]);
    const a = inModel.join(";").split(";").filter((w) => w === cw).length;
    const b = notInModel.join(";").split(";").filter((w) => w === cw).length;
    const c = inModel.length - a;
    const d = notInModel.length - b;

    return ({ a : a, b : b, c : c, d : d, n : a+b+c+d})
}

function createFullCT(cw, selectedTokens, deselectedTokens, cwsColumns){
    const a = countTokens(cw, selectedTokens, cwsColumns);
    const b = countTokens(cw, deselectedTokens, cwsColumns);
    const c = selectedTokens.length - a;
    const d = deselectedTokens.length - b;
    const n = selectedTokens.length + deselectedTokens.length;

    return ({a : a, b : b, c : c, d : d, n : n});

}

function cueValidity(contingency){
    const res = contingency.a === 0 ? 0 : contingency.a / (contingency.a + contingency.b);
    return (d3.format(".3r")(res));
}
function deltaP(contingency){
    const first = cueValidity(contingency);
    const second = contingency.c / (contingency.c + contingency.d);
    return (d3.format(".3r")(first-second));
}
function logFisher(contingency){
    const fisher = exact22(contingency.a, contingency.b, contingency.c, contingency.d);
    const aExp = (contingency.a+contingency.b)*(contingency.a+contingency.c)/(contingency.n);
    const logF = contingency.a < aExp ? Math.log10(fisher) : -Math.log10(fisher);
    return (d3.format(".3r")(logF));
}

function oddsRatio(contingency){
    // smoothed with +0.5 to avoid 0s
    const first = (contingency.a + 0.05) / (contingency.c+0.5);
    const second = (contingency.b + 0.05) / (contingency.d+0.5);
    return (d3.format(".3r")(first/second));
}

function freqFunctions(d, freqcols, cwsColumns, selectedTokens, deselectedTokens) {
    const contingency = createFullCT(d, selectedTokens, deselectedTokens, cwsColumns);
    const raw = {"Feature" : d, "total" : contingency.a}
    const both = {"Feature" : d, "total+" : contingency.a, "total-" : contingency.b}
    const cueV = {"Feature" : d, "total+" : contingency.a, "total-cv" : cueValidity(contingency)}
    const dp = {"Feature" : d, "total+" : contingency.a, "total-dp" : deltaP(contingency)}
    const fisher = {"Feature" : d, "total+" : contingency.a, "total-F" : logFisher(contingency)}
    const OR = {"Feature" : d, "total+" : contingency.a, "total-OR" : oddsRatio(contingency)}
    for (let i = 0; i < freqcols.length; i++) {
        const contingency = createModelCT(cwsColumns[i], d, selectedTokens, deselectedTokens);
        const col = freqcols[i];
        raw[col] = both[col+"+"] = cueV[col+"+"] = dp[col+"+"] = fisher[col+"+"] = OR[col+"+"] = contingency.a;
        both[col + "-"] = contingency.b;
        cueV[col + "-cv"] = cueValidity(contingency);
        dp[col + "-dp"] = cueValidity(contingency);
        fisher[col + "-F"] = logFisher(contingency);
        OR[col + "-OR"] = oddsRatio(contingency);
    }
    return ({raw : raw, both : both, cue : cueV, dp : dp, fisher : fisher, odds : OR});
}

function nameColumns(suffix, freqcols){
    console.log(suffix)
    const cols = ["Feature"];
    if (suffix === "raw"){
        cols.push("total");
        cols.push(...freqcols);
    } else {
        cols.push("total+");
        cols.push("total" + suffix);
        freqcols.forEach((d) => {
            cols.push(d + "+");
            cols.push(d + suffix);
        });
    }
    return(cols);
}
function execute(datasets, type) {
    // const group = getUrlParameter(window.location, "group");
    const modelSelection = listFromLS("modelselection-" + type);
    // const modelSelection = listFromLS("modelselection-" + type + "-group" + group);
    const tokSelection = listFromLS("tokenselection-" + type);
    const selectedTokens = datasets["variables"].filter((t) => tokSelection.indexOf(t["_id"]) !== -1 );
    const deselectedTokens = datasets["variables"].filter((t) => tokSelection.indexOf(t["_id"]) === -1 );
    console.log(selectedTokens.length);
    console.log(deselectedTokens.length);
    function findCwsColumn(m) {
        return (datasets["variables"].columns.filter((d) => {
            return (d.startsWith("_cws.") && m.search(d.slice(5)) === 0)
        })[0]);
    }
    const cwsColumns = modelSelection.map(findCwsColumn);

    const infoOptions = [
        {name : "Absolute frequency", value : "raw", suffix : "raw"},
        {name : "Selected and non selected", value : "both", suffix : "-"},
        {name : "Cue validity", value :"cue", suffix : "-cv"},
        {name : "Log Fisher Exact p-value", value : "fisher", suffix : "-F"},
        {name : "(Smoothed) odds ratio", value : "odds", suffix : "-OR"},
        {name : "&Delta;P", value : "dp", suffix : "-dp"}
    ]

    buildDropdown("info", infoOptions,
        valueFunction = (d) => d.value, textFunction = (d) => d.name)
        .on("click", (d) => drawTable(d, freqcols));

    const cws = cwsColumns.map((m) => { // for each model
        return (selectedTokens.map((d) => { return (d[m]); }).join(";"));
    }).join(";").split(";").filter((d) => {return(d !== "NA"); });

    const freqcols = modelSelection.map((d) => modelSelection.indexOf(d) + 1 ); 

    const cwsFrequencies = _.uniq(cws).map((d) =>
        freqFunctions(d, freqcols, cwsColumns, selectedTokens, deselectedTokens)
        );

    function createTable(info, freqcols){
        const tableData = cwsFrequencies.map((d) => d[info.value]);
        return({tableData : tableData, cols : nameColumns(info.suffix, freqcols)});
    }
    
    function drawTable(info, freqcols){
        d3.select("#report")
            .text(`Frequency table with ${info.name}`)
        d3.select("#cwsFreq").selectAll("div").remove();
        d3.select("#cwsFreq").selectAll("table").remove();
        
        const tableData = createTable(info, freqcols);
        console.log(tableData.cols)
        console.log(typeof tableData.cols[3])
        
        const table = d3.select("#cwsFreq").append("table").attr("class", "hover");
        table.append('thead').append('tr')
            .selectAll('th')
            .data(tableData.cols).enter()
            .append("th")
            .text(d => d);
    
        const rows = table.append('tbody').selectAll('tr')
            .data(tableData.tableData).enter()
            .append('tr')        
        
        rows.selectAll('td')
            .data((d) => tableData.cols.map((k) => {return({ 'name': k, 'value': d[k] })}))
                .enter()
            .append('td')
            .attr("class", d => typeof d.name === "string" && (d.name.endsWith("+") | d.name.endsWith("A")) ? "plus" : "minus")
            .attr('data-th', d => d.name)
            .text(d => d.value);

        $("table").DataTable({
            'destroy' : true,
            "order": [[1, "desc"]]
            // "columnDefs": [{ "visible": false, "targets": 1 }]
        });
    }

    
    drawTable(infoOptions[0], freqcols);
}