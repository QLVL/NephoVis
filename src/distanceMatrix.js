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
function execute(datasets, type) {
    const { modelsdist : data } = datasets;
    const distWidth = 350,
        distHeight = 350,
        distPad = 25;
    var color;

    const modselection = listFromLS("modelselection-" + type);
    const distances = data.filter(d => modselection.indexOf(d['_model']) !== -1);
    

    const distMatrix = d3.select("#distMatrix").append("svg")
        .attr("width", distWidth)
        .attr("height", distHeight)
        .attr("padding", distPad)
        .attr("transform", `translate(${distPad},${distPad})`);

    const miniWidth = (distWidth-3*distPad)/distances.length;
    const miniHeight = (distHeight-3*distPad)/distances.length;

    const distCols = distMatrix.append('g');

    distCols.selectAll('text')
        .data(modselection).enter()
        .append('text')
        .attr('x', d=> distPad + miniWidth*(modselection.indexOf(d)+0.5))
        .attr('y', distPad/2)
        // .style('font-size', '0.6em')
        .text(d => modselection.indexOf(d)+1);

    const distRows = distMatrix.append('g');

    distRows.selectAll('text')
        .data(modselection).enter()
        .append('text')
        .attr('x', 0)
        .attr('y', d => distPad + miniHeight *(modselection.indexOf(d)+0.5))
        // .style('font-size', '0.6em')
        .text(d => modselection.indexOf(d)+1);

    const valRange = Math.max(...distances.map(d => Math.max(...d3.values(d).filter(d => !isNaN(d)))));
    color = d3.scaleSequential(d3.interpolateGreens)
        .domain([0, Math.max(1, valRange)]);

    rows = distMatrix.append("g")
        .selectAll(".distrowrow")
        .data(distances)
        .enter()
        .append("g")
            .attr('class', 'distrow')
            .attr('transform', function(d) {
                return('translate(' + distPad + ',' + (distPad + miniHeight * modselection.indexOf(d['_model'])) + ')');
            })
            .each(fillRow);

    function fillRow(p) {
        const row = d3.select(this);
        const rowData = modselection.map(d => ({"model" : d, "value" : p[d]}));
        

        row.selectAll("rect")
            .data(rowData)
            .enter()
            .append('rect')
            .attr('width', miniWidth)
            .attr('height', miniHeight)
            .attr('transform', function(d) {
                return ('translate(' + miniWidth * (modselection.indexOf(d.model)) + ', 0)'); 
                })
            .style('fill', d => color(d.value));

        row.selectAll('text')
            .data(rowData).enter()
                .append('text')
                .attr('x', d => miniWidth * (modselection.indexOf(d.model)+0.3))
                .attr('y', miniHeight/2)
                .attr('dy', (1/modselection.length) + 'em')
                .attr('dx', '-' + (1/modselection.length) + 'em')
                .text(d => d3.format('.2f')(d.value))
                .style('font-size', (1/modselection.length)*4  + 'em')
                .style('fill', function(d) {
                    var light = d3.hsl(color(d.value))['l'];
                    return(light <= 0.5 ? 'white' : 'black');
                    })
                .style('font-weight', 'bold');
    }
}