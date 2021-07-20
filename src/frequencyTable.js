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

function execute(datasets, type, other_args) {
    const { variables : bigdata,
        ppmi : freqdata}  = datasets;
    const cws_column = other_args;

    const tokselection = listFromLS("tokenselection-" + type);
    const cws = bigdata.filter(d => tokselection.indexOf(d['_id']) !== -1)
        .map(d => d[cws_column])
        .join(';').split(';')
        .filter(d => freqdata.map(c => c.cw).indexOf(d)>-1);
    console.log(cws)

    const mySet = new Set(cws);

    const freqcols = freqdata.columns.filter(d => d !== 'cw');

    cwsFreq = Array.from(mySet).map(function (d) {
        const freqs = freqdata.filter(p => p.cw === d)[0];
        
        const tokens = cws.filter(p => p.split(';').indexOf(d) !== -1).length;

        const set_var = { 'cw': d, 'tokens': tokens };
        freqcols.forEach((x) => {
            set_var[x] = d3.format('.3')(freqs[x]);
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
        .text(d => d);

    const rows = table.append('tbody').selectAll('tr')
        .data(cwsFreq).enter()
        .append('tr');
    rows.selectAll('td')
        .data(d => d3.keys(cwsFreq[0]).map(k => ({ 'name': k, 'value': d[k] })))
        .enter()
        .append('td')
        .attr('data-th', d => d.name)
        .text(d => d.value);

    $("table").DataTable({
        // 'destroy' : true,
        'order': [[1, 'desc']]
    });
}