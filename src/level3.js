const settings = {
  level: "token",
  model: getUrlParameter(window.location, "model"),
  width: 600,
  height: 600,
  padding: 40,
  t: d3.transition().duration(1000),
  tokenSvg: {},
  focSvg: {},
  color: d3.scaleOrdinal(myColors),
  shape: d3.scaleOrdinal(d3.symbols),
  size: d3.scaleLinear().range([40, 200]),
  cwSelection: []
}

function collectFromStorage(settings) {
  const { type, level } = settings;

  settings.modelSelection = listFromLS("modelselection-" + type);
  settings.tokenSelection = listFromLS(level + "selection-" + type);
  settings.storageSolution = JSON.parse(localStorage.getItem("solution-" + type));
  settings.chosenSolution = _.isNull(settings.storageSolution) ? settings.alternatives[0] : settings.storageSolution;
  if (settings.chosenSolution === undefined) { settings.chosenSolution = "tokens"; }

}
function setUpTexts(settings) {
  const { type, model, chosenSolution } = settings;
  d3.select("h1").html("Level 3 (<em>" + type + "</em>)");
  d3.select("h3#modelName").html(model);

  if (!(_.isNull(chosenSolution))) {
    const technique = chosenSolution.toLowerCase().search("tsne") > -1 ? "t-SNE, perplexity: " + chosenSolution.match("[0-9]+") : chosenSolution.toUpperCase();
    d3.select("h4#solutionName").text("Technique: " + technique);
  }


}

function setUpButtons(settings) {
  const { tokenSelection, level, type, cwsColumn, dataset } = settings;
  // clear selection of models
  d3.select("#clearSelect")
    .on("click", () => {
      settings.cwSelection = [];
      clearStorage(tokenSelection, level, type);
      d3.select("#tokenCheckboxes").selectAll("div").remove();
      d3.selectAll(".brush").remove()
    });

  d3.select("#modelSelect")
    .on("click", function () {
      const group = getUrlParameter(window.location, "group");
      window.open("level2.html" + "?type=" + type + "&group=" + group);
    });

  d3.select("#solutions").selectAll("button").on("click", function (d) {
    localStorage.setItem("solution-" + type, JSON.stringify(d));
    d3.select("#solutions").selectAll("button").html(t => t === d ? "<b>" + t + "</b>" : t);
    const technique = d.toLowerCase().search("tsne") > -1 ? "t-SNE, perplexity: " + d.match("[0-9]+") : d.toUpperCase();
    d3.select("h4#solutionName").text("Technique: " + technique);
    settings.chosenSolution = d;
    applySolution(settings);
  });

  d3.select("#findTokensFeatureBtn").on("click", () => findByContext(cwsColumn, "Feature", settings));
  d3.select("#findTokensContextBtn").on("click", () => {
    findByContext((varFromLS(dataset, "ctxt", level, type)["variable"] || "_ctxt.raw"), "Context", settings);
  });
  d3.select("#showTable").on("click", function () {
    const params = "width=700,height=700,menubar=no,toolbar=no,location=no,status=no";
    window.open("frequencyTable.html?type=" + type + "&column=" + cwsColumn, "freqtable", params);
  });
}

function findByContext(column, by, settings) {
  const { dataset, tokenSelection } = settings;
  const cw2search = d3.select("#findTokensBy" + by).property("value");
  const result = dataset.filter(d => {
    return (d[column].search(cw2search) !== -1);
  });
  if (result.length > 0) {
    _.pullAll(tokenSelection, tokenSelection);
    result.forEach(function (d) { tokenSelection.push(d["_id"]); });
    updateSelections(settings);
  } else {
    const spec = by === "Feature" ? "as a feature" : "in a concordance";
    window.alert('Sorry, "' + cw2search + '" is not present ' + spec + ' in this model.');
  }
}

function token2context(settings) {
  const { dataset, cwsColumn, tokenSelection } = settings;
  selectedFOCs = dataset.filter((d) => tokenSelection.indexOf(d["_id"]) !== -1)
    .map((d) => d[cwsColumn]).join(";").split(";");
  settings.cwSelection = selectedFOCs;
  updateSelections(settings);
}
function context2token(settings) {
  const { dataset, cwsColumn, cwSelection } = settings;
  const tokens = cwSelection.map((cw) => dataset.filter((d) => d[cwsColumn].search(cw) !== -1).map((d) => d["_id"])).flat()

  settings.tokenSelection = _.uniq(tokens);
  updateSelections(settings);
}

function updateSelections(settings) {
  const { tokenSelection, cwSelection, type, level } = settings;
  if (tokenSelection.length > 0 && tokenSelection.indexOf("undefined") > -1) _.pull(tokenSelection, "undefined");
  if (cwSelection.length > 0 && cwSelection.indexOf("undefined") > -1) _.pull(cwSelection, "undefined");

  ["color", "shape", "size"].forEach((variable) => { boldenLegend(variable, level, type) });
  localStorage.setItem(level + "selection-" + type, tokenSelection.length > 0 ? JSON.stringify(tokenSelection) : JSON.stringify(null));
  // if something is selected everything else is translucent
  settings.tokenSvg.svg.selectAll(".dot")
    .selectAll("path.graph")
    .call(styleToken, settings);

  settings.focSvg.svg.selectAll(".dot")
    .selectAll("path.graph")
    .call(styleCw, settings);
}

function setUpDropdowns(settings) {
  const { dataset, level, type, nominals, tailoredNumerals, tailoredContexts, modelSelection, model } = settings;

  buildDropdown("colour", nominals).on("click", function () {
    settings.colorvar = updateVar(dataset, "color", this.value, level, type);
    settings.colorselection = [];
    updatePlot(settings);
    updateLegend2(settings);
  });

  buildDropdown("shape",
    nominals.filter((d) => (d === "Reset" || getValues(dataset, d).length <= 7)))
    .on("click", function () {
      settings.shapevar = updateVar(dataset, "shape", this.value, level, type);
      settings.shapeselection = [];
      updatePlot(settings);
      updateLegend2(settings);
    });

  buildDropdown("size", tailoredNumerals, valueFunction = d => d.value, textFunction = d => d.key)
    .on("click", function () {
      settings.sizevar = updateVar(dataset, "size", this.value, level, type);
      updatePlot(settings);
      updateLegend2(settings);
    });

  buildDropdown("ctxt", tailoredContexts, valueFunction = d => d.value, textFunction = d => d.key)
    .on("click", function () {
      settings.ctxtvar = updateVar(dataset, "ctxt", this.value, level, type)["variable"];
    });

  buildDropdown("models", modelSelection,
    valueFunction = d => d,
    textFunction = d => {
      const txt = _.replace(d, type + ".", "");
      return (d === model ? "<b>" + txt + "</b>" : txt)
    }
  )
    .on("click", function () {
      window.open("level3.html" + "?type=" + type + "&model=" + this.value, "_self");
    });

  d3.select("#tokenIDs").selectAll("option")
    .data(dataset.map((d) => d["_id"]))
    .enter()
    .append("option")
    .attr("value", d => d);

}

$(document).on("change", 'input[name="tokenChoice"]', function () {
  const tokenID = this.value;
  const tokenIDbis = _.replace(tokenID, /\//g, ":");

  d3.select("#tokenCheckboxes")
    .append("div").attr("class", "btn-group-toggle")
    .attr("data-toggle", "buttons")
    .append("label").attr("class", "btn btn-secondary")
    .text(tokenID.split("/").splice(2).join("/"))
    .style("font-size", 5)
    .append("input").attr("type", "checkbox")
    .attr("name", "chosenToken")
    .attr("value", tokenID).attr("placeholder", "tokenID")
    .property("checked", true).property("active", true)

  if (settings.tokenSelection.indexOf(tokenID) === -1) settings.tokenSelection.push(tokenID);
  updateSelections(settings);

  d3.select(this).property("value", "")
});

$(document).on("change", "input[name='chosenToken']", function () {
  const tokenID = this.value;
  _.pull(settings.tokenSelection, tokenID);
  updateSelections(settings);
  d3.select(this.parentNode).remove();

});

function zoomed() {
  const zooming = d3.select(this).node().id.split("-")[1];
  settings[zooming].newX = d3.event.transform.rescaleX(settings[zooming].x);
  settings[zooming].newY = d3.event.transform.rescaleY(settings[zooming].y);
  adjustPlot(settings[zooming], settings.chosenSolution, 10);
};

function adjustValues(settings, tduration = 1000) {
  adjustPlot(settings.tokenSvg, settings.chosenSolution, tduration);
  adjustPlot(settings.focSvg, settings.chosenSolution, tduration);
}
function adjustPlot(valueSet, chosenSolution, tduration = 1000) {
  // const { svg, xAxis, yAxis, newX, newY, dot_present } = valueSet;
  const { svg, newX, newY, dot_present } = valueSet;

  // svg.select("#xaxis").transition().duration(tduration)
  //   .call(xAxis.scale(newX)); // x axis rescaled
  // svg.select("#yaxis").transition().duration(tduration)
  //   .call(yAxis.scale(newY)); // y axis rescaled
  dot_present
    .transition().duration(tduration)
    .attr("transform", d => "translate(" + newX(d[chosenSolution + ".x"]) + "," + newY(d[chosenSolution + ".y"]) + ")"); // dots repositioned
  svg.select("#xCenter").transition().duration(tduration)
    .attr("x1", newX(0)).attr("x2", newX(0)); // central x rescaled
  svg.select("#yCenter").transition().duration(tduration)
    .attr("y1", newY(0)).attr("y2", newY(0)); // central y rescaled
  svg.selectAll(".brush").remove();
}
function setUpCanvas(container, settings, target) {
  const { width, height, padding, chosenSolution } = settings;
  let svgData = settings[target];
  const dataset = target === "tokenSvg" ? settings.dataset : settings.focdists;
  
  container.selectAll("svg").remove();
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${height} ${width}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    // .classed("svgPlot", true)
    // .attr("height", height)
    // .call(responsivefy)
    // .attr("transform", "translate(0,0)")
    .append("g")
    .attr("id", "zoom-" + target)
    .call(d3.zoom().on('zoom', zoomed));

  modelRange = [...getValues(dataset, chosenSolution + ".x"), ...getValues(dataset, chosenSolution + ".y")]
  const range = setRange(modelRange, 1.05);

  // const xrange = setRange(getValues(dataset, chosenSolution + ".x"), 1.1);
  // const yrange = setRange(getValues(dataset, chosenSolution + ".y"), 1.1);
  svgData.x = d3.scaleLinear()
    // .domain(xrange)
    .domain(range)
    .range([padding, width - padding]);

  svgData.y = d3.scaleLinear()
    // .domain(yrange)
    .domain(range)
    .range([height - padding, padding]);
  svgData.newX = svgData.x;
  svgData.newY = svgData.y;
  // Vertical center
  traceCenter(svg, x1 = svgData.newX(0), x2 = svgData.newX(0), y1 = padding, y2 = height - padding)
    .attr("id", "xCenter");

  // Horizontal center
  traceCenter(svg, x1 = padding, x2 = width - padding, y1 = svgData.newY(0), y2 = svgData.newY(0))
    .attr("id", "yCenter");

  // Axes (tickSizeOuter(0) avoids overlap of axes)
  // svgData.xAxis = d3.axisBottom(svgData.newX)
  //   // .ticks(0)
  //   .tickSizeOuter(0);
  // svg.append("g")
  //   .attr("id", "xaxis")
  //   .attr("transform", "translate(0, " + (height - padding) + ")")
  //   .call(svgData.xAxis);

  // svgData.yAxis = d3.axisLeft(svgData.newY)
  //   // .ticks(0)
  //   .tickSizeOuter(0);
  // svg.append("g")
  //   .attr("id", "yaxis")
  //   .attr("transform", "translate(" + padding + ", 0)")
  //   .call(svgData.yAxis);

  setPointerEvents(svg, width, height);

  svgData.present = dataset.filter((d) => exists(d, chosenSolution));
  svgData.bin = dataset.filter((d) => !(exists(d, chosenSolution)));

  if (target === "focSvg") {
    svgData.tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    svgData.removeButton = svg.append("text")
      .attr("x", width-padding*2)
      .attr("y", padding)
      .html("&#x274C;")
      .style("border", "solid 1px red")
      .style("cursor", "pointer")
      .on("click", removeFocDists);
  }
  // Dots on plot
  svg.append("g")
    .attr("transform", "translate(0,0)")
    .attr("class", "dot")
    .selectAll("path")
    .data(svgData.present).enter()
    .append("path")
    .attr("class", "graph present")
    .attr("transform", (d) => "translate(" + svgData.newX(d[chosenSolution + ".x"]) + "," + svgData.newY(d[chosenSolution + ".y"]) + ")")
    .call(styleDot, settings, target);

  // Lost tokens

  if (svgData.bin.length > 0) {
    const sidebar = d3.select(".sidebar").append("div").attr("id", "#lost" + target);
    const sidebarWidth = parseInt(sidebar.style("width"));
    const dotsPerRow = Math.floor((sidebarWidth - 20) / 10);
    const dotsColumns = Math.ceil(svgData.bin.length/dotsPerRow);
    const lostitem = target === "tokenSvg" ? "tokens" : "FOCs";
    // sidebar.style("height", dotsColumns*10 + 20)
    sidebar.append("hr");
    sidebar.append("h5")
      .text("Lost " + lostitem);

    sidebar.append("svg")
      .attr("width", sidebarWidth)
      .attr("height", dotsColumns*10 + padding/2)
      .attr("transform", "translate(0,0)")
      .append("g")
      .attr("transform", "translate(" + 10 + "," + 10 + ")")
      .attr("class", "dot")
      .selectAll("path")
      .data(svgData.bin).enter()
      .append("path")
      .attr("class", "graph lost")
      .attr("transform", function (d) {
        const j = Math.floor(svgData.bin.indexOf(d) / dotsPerRow);
        const i = svgData.bin.indexOf(d) - (j * dotsPerRow);
        return ("translate(" + (i * 10) + "," + (j * 10) + ")");
      })
      .call(styleDot, settings, target);
  }

  svgData.dot = d3.selectAll(".dot").selectAll("path");
  svgData.dot_present = d3.selectAll(".dot").selectAll("path.present");
  svgData.svg = svg;
  updateLegend2(settings);

}

function applySolution(settings) {
  const { dataset, focdists, chosenSolution } = settings;
  const xrange = setRange(getValues(dataset, chosenSolution + ".x"), 1.1);
  const yrange = setRange(getValues(dataset, chosenSolution + ".y"), 1.1);
  settings.tokenSvg.newX = settings.tokenSvg.newX.domain(xrange);
  settings.tokenSvg.newY = settings.tokenSvg.newY.domain(yrange);

  if (focdists.length > 0) {
    const xrange = setRange(getValues(focdists, chosenSolution + ".x"), 1.1);
    const yrange = setRange(getValues(focdists, chosenSolution + ".y"), 1.1);
    settings.focSvg.newX = settings.focSvg.newX.domain(xrange);
    settings.focSvg.newY = settings.focSvg.newY.domain(yrange);
    
  }
  adjustValues(settings);
}

function styleDot(selection, settings, target) {
  target === "tokenSvg" ? styleToken(selection, settings) : styleCw(selection, settings);
}
function styleToken(selection, settings) {

  const { shapevar, sizevar, colorvar, tokenSelection, shape, size, level, type } = settings;
  
  const color = colorvar.values.length <= 8 ? settings.color : d3.scaleOrdinal(d3.schemeSet3);
  selection.attr("d", d3.symbol()
    .type((d) => code(d, shapevar, shape, d3.symbolCircle))
    .size((d) => code(d, sizevar, size, 64))
  )
    .style("stroke", "gray")
    .style("fill", (d) => code(d, colorvar, color, "#1f77b4"))
    .style("opacity", tokenSelection.length > 0 ? 1 : 0.7)
    .classed("lighter", (d) => tokenSelection.length > 0 ? (tokenSelection.indexOf(d["_id"]) === -1) : false)
    // .classed("lost", function(d) {return (!exists(d, chosenSolution)); })
    .on("mouseover", showContext)
    .on("mouseout", function () {
      d3.select("#concordance").select("p").remove();
      d3.selectAll(".selector").remove();
    })
    .on("click", function (d) {
      _.pullAll(tokenSelection, tokenSelection);
      listFromLS(level + "selection-" + type).forEach(d => tokenSelection.push(d));
      tokenSelection.indexOf(d["_id"]) === -1 ? tokenSelection.push(d["_id"]) : _.pull(tokenSelection, d["_id"]);
      token2context(settings);
    });

}
function countTokensForCw(settings, cw2search) {
  const { dataset, cwsColumn, tokenSelection } = settings;

  const tokens = dataset.filter((d) => {
    return((tokenSelection.length === 0 || tokenSelection.indexOf(d["_id"]) !== -1) && 
    d[cwsColumn].split(";").indexOf(cw2search) !== -1);
  }).length;
  return(tokens);
}

function styleCw(selection, settings) {
  const tooltip = settings.focSvg.tooltip;
  selection.attr("d", d3.symbol().type(d3.symbolStar)
    .size((d) => {
    const isSelected = settings.cwSelection.indexOf(d["_id"]) !== -1;
    return(isSelected ? settings.size.domain([1, settings.tokenSelection.length])(countTokensForCw(settings, d["_id"])) : 64);
  }))
    .style("stroke", "gray")
    .style("fill", "#1f77b4")
    .style("opacity", settings.cwSelection.length > 0 ? 1 : 0.7)
    .classed("lighter", (d) => settings.cwSelection.length > 0 ? settings.cwSelection.indexOf(d["_id"]) === -1 : false)
    // .classed("lost", function(d) {return (!exists(d, chosenSolution)); })
    .on("click", (d) => {
      settings.cwSelection.indexOf(d["_id"]) === -1 ? settings.cwSelection.push(d["_id"]) : _.pull(settings.cwSelection, d["_id"]);
      context2token(settings);
    })
    .on("mouseover", (d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`${d["_id"]} (${countTokensForCw(settings, d["_id"])} tokens)`)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

}

function showContext(d) {
  const { colorvar, tailoredContexts, dataset, level, type } = settings;
  const color = colorvar.values.length <= 8 ? settings.color : d3.scaleOrdinal(d3.schemeSet3);

  const tooltipColor = code(d, colorvar, color, "#1f77b4");
  // var tooltiptext = typeof(ctxtvar) == "string" ? d[ctxtvar].replace(/<em>/g, "<em style="color:" +tooltipcolor + ";font-weight:bold;">") : ""
  let ctxtvar = settings.ctxtvar || "_ctxt.raw";
  if (_.isEmpty(_.filter(tailoredContexts, ["value", ctxtvar]))) {
    const newVar = _.filter(tailoredContexts, ["key", "model"])[0]["value"];
    ctxtvar = updateVar(dataset, "ctxt", newVar, level, type)["variable"];
  }
  const tooltipText1 = "<p><b>" + d["_id"] + "</b></p><p>";
  const tooltipText2 = d[ctxtvar].replace(/class=["']target["']/g, 'style="color:' + tooltipColor + ';font-weight:bold;"') + "</p>";
  // var tooltiptext = d[model + ".x"] + ", " + d[model + ".y"];

  d3.select("#concordance").append("p")
    .attr("class", "text-center p-2 ml-2")
    .style("border", "solid")
    .style("border-color", "gray")
    .style("font-size", "0.8em")
    .html(tooltipText1 + tooltipText2);

  d3.select(this.parentNode)
    .append("path")
    .attr("class", "selector")
    .attr("transform", d3.select(this).attr("transform"))
    .attr("d", d3.symbol().type(d3.symbolCircle).size(250))
    .style("fill", "none")
    .style("stroke", compColor(d3.select(this).style("fill")))
    .style("stroke-width", 2);

  settings.ctxtvar = ctxtvar;
}

//FOR THE BRUSH
function brushingTokens(settings) {
  const e = d3.event.selection;
  const { chosenSolution, padding } = settings;
  const { newX, newY, dot } = settings.tokenSvg;
  if (!(_.isNull(e))) {
    dot.classed("lighter", function (d) {
      var xc = newX(d[chosenSolution + ".x"]);
      var yc = newY(d[chosenSolution + ".y"]);
      // var xc = d3.select(this).attr("xcoord");
      // var yc = d3.select(this).attr("ycoord");
      return ((xc < e[0][0] + padding ||
        xc > e[1][0] + padding ||
        yc < e[0][1] + padding ||
        yc > e[1][1] + padding) &&
        exists(d, chosenSolution));
    });
  }
}

function brushedTokens(settings) {
  const { chosenSolution } = settings;
  _.pullAll(settings.tokenSelection);
  settings.tokenSvg.dot.each(function (d) {
    if (!(d3.select(this).classed("lighter")) && exists(d, chosenSolution)) {
      settings.tokenSelection.push(d["_id"]);
      
    }
  });
  token2context(settings);
}

function brushingFocs(settings) {
  const e = d3.event.selection;
  const { chosenSolution, padding } = settings;
  const { newX, newY, dot } = settings.focSvg;
  if (!(_.isNull(e))) {
    dot.classed("lighter", function (d) {
      var xc = newX(d[chosenSolution + ".x"]);
      var yc = newY(d[chosenSolution + ".y"]);
      // var xc = d3.select(this).attr("xcoord");
      // var yc = d3.select(this).attr("ycoord");
      return ((xc < e[0][0] + padding ||
        xc > e[1][0] + padding ||
        yc < e[0][1] + padding ||
        yc > e[1][1] + padding) &&
        exists(d, chosenSolution));
    });
  }
}

function brushedFocs(settings) {
  const { chosenSolution } = settings;
  _.pullAll(settings.cwSelection);
  settings.focSvg.dot.each(function (d) {
    if (!(d3.select(this).classed("lighter")) && exists(d, chosenSolution)) {
      settings.cwSelection.push(d["_id"]);
    }
  });
  context2token(settings);
}

// Updating color, shape and size after every button clicking
function updatePlot(settings) {
  const { colorvar, shapevar, sizevar, shape, size } = settings;
  const color = colorvar.values.length <= 8 ? settings.color : d3.scaleOrdinal(d3.schemeSet3);
  d3.selectAll(".dot").selectAll("path").style("fill", (d) => code(d, colorvar, color, "#1f77b4"))
    .attr("d", d3.symbol()
      .type((d) => code(d, shapevar, shape, d3.symbolCircle))
      .size((d) => code(d, sizevar, size, 64)));
}

function offerFocDists(datasets, alternatives, model) {
  const coords = subsetCoords(datasets, alternatives[0] + ".cws", model, alternatives[0]);
  for (let i = 1; i < alternatives.length; i++) {
    mergeVariables(coords, subsetCoords(datasets, alternatives[i] + ".cws", model, alternatives[i]));
  }
  return (coords)
}

function removeFocDists() {
  d3.select("#svgContainer2").remove();
  settings.tokenSvg.svg
    .append("text")
    .attr("id", "addFocDists")
    .attr("x", settings.width-settings.padding*2)
    .attr("y", settings.padding)
    .html("&#x2795;")
    .style("color", "green")
    .style("cursor", "pointer")
    .on("click", () => {
      d3.select("#miniPlots").append("div").attr("id", "svgContainer2").attr("class", "largeSvg");
      setUpCanvas(d3.select("#svgContainer2"), settings, target = "focSvg");
      d3.select("#addFocDists").remove();
    });

}

function execute(datasets, type, alternatives) {
  settings.type = type;
  settings.alternatives = alternatives;

  settings.datasets = datasets;
  settings.dataset = offerAlternatives(datasets, alternatives, settings.model, type);
  settings.focdists = offerFocDists(datasets, alternatives, settings.model);

  collectFromStorage(settings);
  setUpTexts(settings);
  
  mergeVariables(settings.dataset, datasets["variables"]);

  Object.assign(settings, initVars2(settings));
  settings.contexts = settings.colnames["contexts"];
  settings.ctxtvar = varFromLS(settings.dataset, "ctxt", settings.level, type)["variable"];

  settings.tailoredContexts = settings.contexts
    .filter(d => {
      return (d.split(".").length === 2 || settings.model.search(d.split(".").splice(1).join(".")) === 0);
    })
    .map(d => {
      return ({
        "key": d.split(".").length === 2 ? d.split(".")[1] : "model",
        "value": d
      });
    });

  settings.tailoredNumerals = settings.numerals
    .filter((d) => {
      return (!d.startsWith("_count") || settings.model.search(d.split(".").splice(1).join(".")) === 0);
    })
    .map((d) => {
      return ({
        "key": d.startsWith("_count") ? "number of foc" : d,
        "value": d
      });
    });
  // These last lines are only if you use the "ctxt2" dropdown instead of "ctxt" (for tailored contexts, that is, matched to the cloud)

  // Context words!
  settings.cwsColumn = settings.colnames["all"].filter(function (d) {
    return (d.startsWith("_cws") && settings.model.search(d.slice(5)) === 0);
  });

  setUpDropdowns(settings);
  setUpButtons(settings);

  // Set up canvas #######################################################################################
  setUpCanvas(d3.select("#svgContainer1"), settings, target = "tokenSvg");
  if (d3.keys(datasets).indexOf("mds.cws") !== -1) {
    setUpCanvas(d3.select("#svgContainer2"), settings, target = "focSvg");
  }
  
  settings.tokenSvg.brush = d3.brush()
    .extent([[0, 0], [settings.width, settings.height]])
    .on("start", () => _.pullAll(settings.tokenSelection, settings.tokenSelection))
    .on("brush", () => brushingTokens(settings))
    .on("end", () => brushedTokens(settings));

  settings.focSvg.brush = d3.brush()
    .extent([[0, 0], [settings.width, settings.height]])
    .on("start", () => _.pullAll(settings.cwSelection, settings.cwSelection))
    .on("brush", () => brushingFocs(settings))
    .on("end", () => brushedFocs(settings));


  // Select brush or click
  $(document).on("change", 'input[name="selection"]', function () {
    const svg1 = settings.tokenSvg.svg;
    const svg2 = settings.focSvg.svg;
    if (d3.select(this).attr("value") === "brush") {
      svg1.append("g")
        .attr("transform", "translate(" + settings.padding + ", " + settings.padding + ")")
        .attr("class", "brush")
        .call(settings.tokenSvg.brush);
      svg2.append("g")
        .attr("transform", "translate(" + settings.padding + ", " + settings.padding + ")")
        .attr("class", "brush")
        .call(settings.focSvg.brush);
    } else {
      d3.selectAll(".brush").remove();
    }
  });

  token2context(settings);

}

