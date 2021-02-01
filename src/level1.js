function execute(datasets, type) {
  const width = 600;
  const height = 600;
  const padding = 40;
  const dataset = datasets["model"];
  const level = 'model';
  // const LSselectionIndex = listFromLS("modelselection-" + type + "-groups");
  // LSselectionIndex.filter((d) => {return(d3.keys(localStorage).indexOf("modelselection-" + type + "-group" + d) > -1)});
  // console.log(LSselectionIndex);
  // let selectionIndex = LSselectionIndex.length === 0 ? +0 : _.max(LSselectionIndex);

  /// SET UP WORKSPACE ######################################################################################################################

  d3.select("h1").html("Level 1 (<em>" + type + "</em>)");
  
  // Set buttons behaviour ##########################################################

  d3.select("#clearSelect")
    .on("click", () =>  {
      clearStorage(modelSelection, level, type);
      resetVariable(type + "-modselectionFromButtons");
      d3.select("#numSelected").text(modelSelection.length);
      _.keys(variableSelection).forEach(v => _.pullAll(variableSelection[v], variableSelection[v]))
      d3.selectAll("label[name='selectionByButtons']").classed("active", false);
    });

  d3.select("#medoidsSelect")
    .attr("disabled", () => {return(d3.keys(datasets).indexOf("medoids") === -1 ? true : null)})
    .on("click", () => {
      const medoids = datasets["medoids"].map((d) => d.medoid);
      updateModelSelection(medoids);
    });
  d3.select("#modelSelect").on("click", function () {
    // localStorage.setItem("modelselection-" + type + "-groupnone", JSON.stringify(modelSelection));
    window.open("level2.html" + "?type=" + type);
    // window.open("level2.html" + "?type=" + type + "&group=none");
  });

  // d3.select("#modelGroup").on("click", function () {
  //   LSselectionIndex.filter((d) => {return(d3.keys(localStorage).indexOf("modelselection-" + type + "-group" + d) > -1)});
  //   console.log(LSselectionIndex)
  //   if (LSselectionIndex.length > 0 && selectionIndex == _.max(LSselectionIndex)) selectionIndex += 1;
  //   localStorage.setItem("modelselection-" + type + "-group" + selectionIndex, JSON.stringify(modelSelection));
  //   LSselectionIndex.push(selectionIndex);
  //   localStorage.setItem("modelselection-" + type + "-groups", JSON.stringify(LSselectionIndex));
  //   window.open("level2.html" + "?type=" + type + "&group=" + selectionIndex);
  // });

  // d3.select("#model2buttons")
  //   .selectAll("button")
  //   .data(LSselectionIndex).enter()
  //   .append("button").attr("type", "button")
  //   .attr("class", "btn shadow-sm btn-marigreen p-2")
  //   .attr("id", (d) => {return("level2group" + d); })
  //   .style("font-weight", "bold")
  //   .text((d)=>{return(d); })
  //   .on("click", (d) => {window.open("level2.html" + "?type=" + type + "&group=" + d);});


  d3.select("#go2index").on("click", function () {
    window.open("index.html", "_self");
  });

  initVars(dataset, "mod"); // sets colnames, nominals, numerals, sizevar, colorvar...

  const foc = nominals.filter(function (d) { return (d.startsWith('foc_')); });
  const soc = nominals.filter(function (d) { return (d.startsWith('soc_')); });

  const modelSelection = listFromLS(level + "selection-" + type);
  d3.select("#numSelected").text(modelSelection.length);

  // Set up selection by buttons ###################################################
  
  const VSFromLS = JSON.parse(localStorage.getItem(type + "-modselectionFromButtons"));
  const variableSelection = _.isNull(VSFromLS) ? _.fromPairs(_.map(nominals, function (x) { return ([x, []]); })) : VSFromLS;
  checkboxSections("focrow", foc, dataset); // create buttons for "foc"
  checkboxSections("socrow", soc, dataset); // create buttons for "soc"
  
  $(document).on('change', 'input', function () {
    const checked = d3.select(this).attr('id');
    const key = checked.split(":")[0];
    const value = checked.split(":")[1];
    variableSelection[key].indexOf(value) === -1 ? variableSelection[key].push(value) : _.pull(variableSelection[key], value);
    localStorage.setItem(type + "-modselectionFromButtons", JSON.stringify(variableSelection));
    updateCheckbox(dataset, variableSelection);
  });


  // Set up dropdowns ################################################################

  buildDropdown("colour", nominals,
  valueFunction = d => d,
  textFunction = d => formatVariableName(d))
    .on("click", function () {
      colorvar = updateVar(dataset, "color", this.value, "mod", type);
      colorSelection = [];
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });

  buildDropdown("shape", nominals,
  valueFunction = d => d,
  textFunction = d => formatVariableName(d))
    .on("click", function () {
      shapevar = updateVar(dataset, "shape", this.value, "mod", type);
      shapeSSelection = [];
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });

  buildDropdown("size", numerals,
  valueFunction = d => d,
  textFunction = d => formatVariableName(d))
    .on("click", function () {
      sizevar = updateVar(dataset, "size", this.value, "mod", type);
      updatePlot();
      updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
    });

  // DRAW PLOT ######################################################################################################################

  // Set up canvas ######################################################################

  const svg = d3.select("#svgContainer").append("svg")
    .attr("viewBox", `0 0 ${height} ${width}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .classed("svgPlot", true)
    // .attr("height", height)
    // .call(responsivefy)
    // .attr("transform", "translate(0,0)")
    .append("g")
    .call(d3.zoom().on('zoom', zoomed));

  //add tooltip (before the svg so it is not on top of it?)
  const tooltip = setTooltip("#svgContainer");

  // Set up pointing area so you can have zoom with the mouse in any point of the plot
  setPointerEvents(svg, width, height);

  // Set up SCALES (axes) - coordinates multiplied to get some padding in a way
  modelRange = [...getValues(dataset, "model.x"), ...getValues(dataset, "model.y")]
  const range = setRange(modelRange, 1.05);
  // const xrange = setRange(getValues(dataset, 'model.x'), 1.1);
  // const yrange = setRange(getValues(dataset, 'model.y'), 1.1);

  const x = d3.scaleLinear()
    // .domain(xrange)
    .domain(range)
    .range([padding, width - padding]);

  const y = d3.scaleLinear()
    // .domain(yrange)
    .domain(range)
    .range([height - padding, padding]);

  let newX = x;
  let newY = y;

  // Vertical center
  const xCenter = traceCenter(svg, x1 = newX(0), x2 = newX(0), y1 = padding, y2 = height - padding);

  // Horizontal center
  const yCenter = traceCenter(svg, x1 = padding, x2 = width - padding, y1 = newY(0), y2 = newY(0));

  // Axes (tickSizeOuter(0) avoids overlap of axes)
  // const xAxis = d3.axisBottom(newX).ticks(0).tickSizeOuter(0);
  // svg.append("g")
  //   .attr("id", "xaxis")
  //   .attr("transform", "translate(0, " + (height - padding) + ")")
  //   .call(xAxis);

  // const yAxis = d3.axisLeft(newY).ticks(0).tickSizeOuter(0);
  // svg.append("g")
  //   .attr("id", "yaxis")
  //   .attr("transform", "translate(" + padding + ", 0)")
  //   .call(yAxis);

  // Design of The Dot ###############################################################################################################

  const dot = svg.append("g")
    .attr("class", "dot")
    .selectAll("path")
    .data(dataset).enter()
    .append('path')
    .attr("class", "graph")
    .attr("transform", function (d) { return ("translate(" + newX(d['model.x']) + "," + newY(d['model.y']) + ")"); }) // coordinates!
    .attr("d", d3.symbol() // original look
      .type(function (d) { return (code(d, shapevar, shape, d3.symbolWye)); }) // original shape
      .size(function (d) { return (code(d, sizevar, size, 64)); })) // original size
    .style('fill', function (d) { return (code(d, colorvar, color8, "#1f77b4")); }) // original color
    .classed("lighter", function (d) { return (modelSelection.length > 0 ? modelSelection.indexOf(d['_model']) === -1 : false); }) // is selected?
    .on("mouseover", mouseoverDot)
    .on('mouseout', function () {
      tooltip.transition().duration(200).style("opacity", 0);
      d3.selectAll(".selector").remove();
    })
    .on('click', function (d) {
      resetVariable(type + "-modselectionFromButtons");
      modelSelection.indexOf(d["_model"]) === -1 ? modelSelection.push(d["_model"]) : _.pull(modelSelection, d["_model"]);
      updateModelSelection(modelSelection);
    });

  // Run basic functions
  updateCheckbox(dataset, variableSelection);
  updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset);
  updateModelSelection(modelSelection);

  // FUNCTIONS #############################################################################################################################

  function mouseoverDot(d) {
    // Extract coordinates from the 'transform' attribute
    const position = d3.select(this).attr("transform").split(',');
    
    const positionX = parseFloat(position[0].split('(')[1]);
    const svgWidth = parseFloat(d3.select(".svgPlot").style("width"));
    const xcoord = svgWidth/width*positionX;
    const positionY = parseFloat(position[1].split(')')[0]);
    const svgHeight = parseFloat(d3.select(".svgPlot").style("height"));
    const ycoord = svgHeight/height*positionY;

    tooltip.transition() // show tooltip
      .duration(200)
      .style("opacity", 1);

    const colorData = _.isNull(colorvar['variable']) ? "" : "<br><b>" + colorvar['variable'] + "</b>: " + d[colorvar['variable']];
    var shapeData = _.isNull(shapevar['variable']) ? "" : "<br><b>" + shapevar['variable'] + "</b>: " + d[shapevar['variable']];
    var sizeData = _.isNull(sizevar['variable']) ? "" : "<br><b>" + sizevar['variable'] + "</b>: " + d3.format(".3r")(+d[sizevar['variable']]);
    tooltip.html("<b>" + d['_model'] + "</b>" + colorData + shapeData + sizeData)
      .style("top", (ycoord) + "px");
    tooltipWidth = tooltip.style("width");
    tooltip.style("left", svgWidth-xcoord > parseInt(tooltipWidth) ? xcoord + "px" : Math.max(0, (xcoord-tooltipWidth)) + "px");
      
    svg.select(".dot")
      .append("path")
      .attr("class", "selector")
      .attr("transform", d3.select(this).attr("transform"))
      .attr("d", d3.symbol().type(d3.symbolCircle).size(250))
      .style("fill", "none")
      .style("stroke", compColor(d3.select(this).style("fill")))
      .style("stroke-width", 2);
  }

  function zoomed() {
    newY = d3.event.transform.rescaleY(y);
    newX = d3.event.transform.rescaleX(x);
    svg.select('#xaxis').call(xAxis.scale(newX)); // x axis rescaled
    svg.select('#yaxis').call(yAxis.scale(newY)); // y axis rescaled
    dot.attr("transform", function (d) {
      return ("translate(" + newX(d['model.x']) + ", " + newY(d['model.y']) + ")");
    }) // dots repositioned
    xCenter.attr("x1", newX(0)).attr("x2", newX(0)); // central x rescaled
    yCenter.attr("y1", newY(0)).attr("y2", newY(0)); // central y rescaled
  };

  // Updating color, shape and size after every button clicking
  function updatePlot() {
    dot.style("fill", function (d) { return (code(d, colorvar, color8, "#1f77b4")); })
      .attr("d", d3.symbol().type(function (d) {
        return (code(d, shapevar, shape, d3.symbolWye));
      }).size(function (d) {
        return (code(d, sizevar, size, 64));
      }));
  }

  function checkboxSections(where, data, dataset) {
    d3.select("#" + where).selectAll("div")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "btn-group-toggle")
      .attr("data-toggle", "buttons")
      .each(appendCheckbox);

    function appendCheckbox(p) {
      const butGroup = d3.select(this);

      const butText = formatVariableName(p);

      butGroup.append("p")
        .attr("class", "mb-0 mt-2")
        .style("font-weight", "bold")
        .text("Select " + butText);

      butGroup.selectAll("label")
        .data(getValues(dataset, p))
        .enter()
        .append("label")
        .attr("class", "btn btn-secondary py-0 m-0")
        .attr("parent", p)
        .attr("name", "selectionByButtons")
        .classed("active", function(d) {
          return(variableSelection[p].indexOf(d) > -1);
        })
        .text(function (d) { return (d); })
        .append("input")
        .attr("type", "checkbox")
        .attr("autocomplete", "off")
        .attr("id", function (d) { return (p + ":" + d); });
    }
  }

  function updateCheckbox(dataset, variableSelection) {
    const selectedValues = _.omitBy(variableSelection, _.isEmpty);

    const selectedTokens = d3.keys(selectedValues).map(function (v) {
      const filteredDataset = dataset.filter(function (row) { // filter by variable
        return (selectedValues[v].indexOf(row[v]) > -1);
      }).map(function (row) { // extract modelname
        return (row["_model"]);
      });
      return (filteredDataset);
    });

    
    _.pullAll(modelSelection, modelSelection);
    modelSelection.push(..._.intersection(...selectedTokens));
    updateModelSelection(modelSelection)
  }

  function updateModelSelection(modelSelection) {
    d3.select("#numSelected").text(modelSelection.length);
    updateSelection(modelSelection, "model", type);
  }
}