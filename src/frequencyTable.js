function execute(datasets, type, other_args) {
    const bigdata = datasets["variables"];
    const freqdata = datasets["weights"];
    const cws_column = other_args;

    const tokselection = listFromLS("tokenselection-" + type);
    const cws = bigdata.filter(function (d) {
        return (tokselection.indexOf(d['_id']) !== -1);
    }).map(function (d) {
        return (d[cws_column]);
    }).join(';').split(';')
        .filter((d) => {
            return(freqdata.map((c) => {return(c.cw); }).indexOf(d)>-1);
        });
    console.log(cws)

    const mySet = new Set(cws);

    const freqcols = freqdata.columns.filter(d => d !== 'cw');

    cwsFreq = Array.from(mySet).map(function (d) {
        const freqs = freqdata.filter(p => p.cw === d)[0];
        
        const tokens = cws.filter(function (p) {
            return (p.split(';').indexOf(d) !== -1);
        }).length;

        const set_var = { 'cw': d, 'tokens': tokens };
        freqcols.forEach(function (x) {
            set_var[x] = d3.format('.3')(freqs[x])
        });
        return (set_var);
    });
    console.log(cwsFreq);

    const cols = ['Feature', 'Tokens', ...freqcols];

    const table = d3.select("#cwsFreq").append("table");
    table.append('thead').append('tr')
        .selectAll('th')
        .data(cols).enter()
        .append("th")
        .text(function (d) { return (d); });

    const rows = table.append('tbody').selectAll('tr')
        .data(cwsFreq).enter()
        .append('tr');
    rows.selectAll('td')
        .data(function (d) {
            return (d3.keys(cwsFreq[0]).map(function (k) {
                return ({ 'name': k, 'value': d[k] });
            }));
        }).enter()
        .append('td')
        .attr('data-th', d => d.name)
        .text(d => d.value);

    $("table").DataTable({
        // 'destroy' : true,
        'order': [[1, 'desc']]
    });
}