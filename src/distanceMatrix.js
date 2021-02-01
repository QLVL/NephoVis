function execute(datasets, type) {
    var data = datasets["distances"], distances;
    var distMatrix, distCols, distRows;
    var miniWidth, miniHeight;
    var distWidth = 350, distHeight = 350, distPad = 25;
    var modselection;
    var color;
    console.log(data);

    modselection = listFromLS("modelselection-" + type);
    console.log(modselection)
    distances = data.filter(function(d) {return (modselection.indexOf(d['_model']) !== -1); });
    console.log(distances)

    distMatrix = d3.select("#distMatrix").append("svg")
        .attr("width", distWidth)
        .attr("height", distHeight)
        .attr("padding", distPad)
        .attr("transform", "translate(" + distPad + "," + distPad + ")");

    miniWidth = (distWidth-3*distPad)/distances.length;
    miniHeight = (distHeight-3*distPad)/distances.length;

    distCols = distMatrix.append('g');

    distCols.selectAll('text')
        .data(modselection).enter()
        .append('text')
        .attr('x', function(d) {return (distPad + miniWidth*(modselection.indexOf(d)+0.5)); })
        .attr('y', distPad/2)
        // .style('font-size', '0.6em')
        .text(function(d) {return (modselection.indexOf(d)+1); });

    distRows = distMatrix.append('g');

    distRows.selectAll('text')
        .data(modselection).enter()
        .append('text')
        .attr('x', 0)
        .attr('y', function(d) {return (distPad + miniHeight *(modselection.indexOf(d)+0.5)); })
        // .style('font-size', '0.6em')
        .text(function(d) {return (modselection.indexOf(d)+1); });

    color = d3.scaleSequential(d3.interpolateGreens);

    rows = distMatrix.append("g")
        .selectAll(".distrowrow")
        .data(distances)
        .enter()
        .append("g")
            .attr('class', 'distrow')
            .attr('transform', function(d) {
            return('translate(' + distPad + ',' + (distPad + miniHeight * modselection.indexOf(d['_model'])) + ')'); })
            .each(fillRow);

    function fillRow(p) {
        var row = d3.select(this);
        var rowData = [];
        modselection.forEach(function(d) {
            rowData.push({'model' : d, 'value' : p[d]})
        });

        row.selectAll("rect")
            .data(rowData)
            .enter()
            .append('rect')
            .attr('width', miniWidth)
            .attr('height', miniHeight)
            .attr('transform', function(d) {
                return ('translate(' + miniWidth * (modselection.indexOf(d.model)) + ', 0)'); 
                })
            .style('fill', function(d) {return (color(d.value)); });

        row.selectAll('text')
            .data(rowData).enter()
                .append('text')
                .attr('x', function(d) {return (miniWidth * (modselection.indexOf(d.model)+0.3)); })
                .attr('y', miniHeight/2)
                .attr('dy', (1/modselection.length) + 'em')
                .attr('dx', '-' + (1/modselection.length) + 'em')
                .text(function(d) {return (d3.format('.2f')(d.value)); })
                .style('font-size', (1/modselection.length)*4  + 'em')
                .style('fill', function(d) {
                    var light = d3.hsl(color(d.value))['l'];
                    return(light <= 0.5 ? 'white' : 'black');
                    })
                .style('font-weight', 'bold');
    }
}