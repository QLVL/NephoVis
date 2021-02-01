// ################################################################################################
// set up general variables for all scripts
const myColors = [
    "#E69F00",
    "#56B4E9",
    "#009E73",
    "#F0E442",
    "#0072B2",
    "#D55E00",
    "#CC79A7",
    "#999999"] //gray
// Okabe Ito palette (taken from colorblindr::palette_OkabeIto)

// Color, shape, size palettes
const color8 = d3.scaleOrdinal(myColors);
const color12 = d3.scaleOrdinal(d3.schemeSet3);
// var color = d3.scaleOrdinal(d3.schemeCategory10);
const shape = d3.scaleOrdinal(d3.symbols);
const size = d3.scaleLinear()
    .range([40, 200]); // remember to set the domain (current variable) before assigning a value

let colnames, nominals, numerals;
let colorvar, shapevar, sizevar;
let colorSelection, shapeSelection;

function initVars(data, level, type) {
    // sets the values of variables to access the data
    colnames = classifyColnames(data);
    nominals = colnames["nominals"];
    numerals = colnames["numerals"];
    colorvar = varFromLS(data, "color", level, type);
    colorSelection = [];

    shapevar = varFromLS(data, "shape", level, type);
    shapeSelection = [];

    sizevar = varFromLS(data, "size", level, type);
}

function initVars2(settings) {
    const { dataset, level, type } = settings;
    // sets the values of variables to access the data
    const colnames = classifyColnames(dataset);
    return ({
        colnames: colnames,
        nominals: colnames["nominals"],
        numerals: colnames["numerals"],
        colorvar: varFromLS(dataset, "color", level, type),
        colorSelection: [],

        shapevar: varFromLS(dataset, "shape", level, type),
        shapeSelection: [],

        sizevar: varFromLS(dataset, "size", level, type)
    })
}

function buildDropdown(where, data, valueFunction = d => d, textFunction = d => d) {
    return (
        d3.select("#" + where)
            .selectAll("button")
            .data(data).enter()
            .append("button")
            .attr("class", "dropdown-item " + where.slice(0, 3))
            .attr("xlink:href", "#")
            .attr("value", valueFunction)
            .html(textFunction)
    );
}


// ################################################################################################
// Functions to help draw the plot
function setRange(values, scale) {
    return ([d3.min(values) * scale, d3.max(values) * scale]);
}

function traceCenter(p, x1, x2, y1, y2) {
    return (
        p.append("line")
            .attr("x1", x1)
            .attr("x2", x2)
            .attr("y1", y1)
            .attr("y2", y2)
            .attr("stroke", "lightgray")
            .attr("stroke-width", 1)
    );
}

function setTooltip(where) {
    return (d3.select(where).append("div").attr("class", "tooltip"));
}

function setPointerEvents(svg, width, height) {
    svg.append("rect")
        .attr("viewBox", `0 0 ${width} ${height}`)
        // .attr("width", width)
        // .attr("height", height)
        // .attr("transform", "translate(0,0)")
        .classed("svgPlot", true)
        .style("pointer-events", "all")
        .style("fill", "none");
}


// // Make svg responsive with script from: https://brendansudol.com/writing/responsive-d3
// function responsivefy(svg) {
//     // get container + svg aspect ratio
//     const container = d3.select(svg.node().parentNode);
//     const width = parseInt(svg.style("width"));
//     const height = parseInt(svg.style("height"));
//     const aspect = width / height;

//     // add viewBox and preserveAspectRatio properties,
//     // and call resize so that svg resizes on inital page load
//     svg.attr("viewBox", "0 0 " + width + " " + height)
//         .attr("perserveAspectRatio", "xMidYMid")
//         .call(resize);

//     // to register multiple listeners for same event type, 
//     // you need to add namespace, i.e., "click.foo"
//     // necessary if you call invoke this function for multiple svgs
//     // api docs: https://github.com/mbostock/d3/wiki/Selections#on
//     d3.select(window).on("resize." + container.attr("id"), resize);

//     // get width of container and resize svg to fit it
//     function resize() {
//         const targetWidth = parseInt(container.style("width"));
//         svg.attr("width", targetWidth)
//             .attr("height", Math.round(targetWidth / aspect));
//     }
// }


function code(d, variable, schema, default_value) {
    if (_.isNull(variable["variable"])) {
        return (default_value);
    } else {
        if (isNaN(default_value)) {
            // Returns the coded result of the index of d's value in the list of values
            return (schema.domain(variable["values"])(d[variable["variable"]]));
            // return (schema(variable["values"].indexOf(d[variable["variable"]])));
        } else {
            return (schema.domain(d3.extent(variable["values"]))(+d[variable["variable"]]));
        }
    }
}

function formatVariableName(varName) {
    return (_.toUpper(_.kebabCase(_.replace(varName, /^[f|s]oc_/, ""))))
}

// Generate complementary colors for the circle on hover
function compColor(col) {
    const res = d3.hsl(col);
    const hue = res["h"];
    const newHue = +hue < 180 ? +(hue + 180) : +(hue - 180);
    res["h"] = newHue;
    return (res.toString());
}



// ################################################################################################
// Functions to obtain and manipulate data

function exists(t, model) {
    return (d3.format(".3r")(t[model + ".x"]) !== "0.00" || d3.format(".3r")(t[model + ".y"]) !== "0.00");
}

// Short function to obtain the possible values of a variable
function getValues(dataset, colname) {
    // const values = d3.map(dataset, function (d) { return d[colname] }).keys();
    const values = _.uniq(_.map(dataset, colname));
    const isNum = values.every(d => { return (!isNaN(d)); });
    if (isNum) {
        return (values.map(function (d) { return +d }).sort());
    } else {
        return (values.map(function (d) { return d.toString(); }).sort());
    }
}

function classifyColnames(dataset) {
    // const colnames = dataset.columns;
    const colnames = _.keys(dataset[0])
    const variables = colnames.filter(d => {
        return (!d.endsWith(".x") &&
            !d.endsWith(".y") &&
            getValues(dataset, d).length > 1);
    });

    const nominals = variables.filter(d => {
        return (!d.startsWith("_") &&
            !getValues(dataset, d).every(v => { return (!isNaN(v)); }));
    }).filter(d => { return (getValues(dataset, d).length <= 10); });
    nominals.push("Reset");

    const numerals = variables.filter(d => {
        return (getValues(dataset, d).every(v => !isNaN(v)));
    });
    numerals.push("Reset");

    const contexts = colnames.filter(d => d.startsWith("_ctxt"));

    return ({
        "all": colnames,
        "variables": variables,
        "nominals": nominals,
        "numerals": numerals,
        "contexts": contexts
    });
}

// Deal with Local Storage

function updateVar(dataset, variable, name, level, type) {
    const variableName = name === "Reset" ? null : name;
    const values = name === "Reset" ? +0 : getValues(dataset, name);

    localStorage.setItem(level + "-" + variable + "var-" + type, JSON.stringify(variableName));
    return ({ "variable": variableName, "values": values });
}

function resetVariable(item) {
    localStorage.setItem(item, JSON.stringify(null));
}

function clearStorage(selection, level, type) {
    _.pullAll(selection, selection);
    ["color", "shape", "size"].forEach(function (v) {
        resetVariable(_.join([v + "sel", level, type], "-"));
    });
    updateSelection(selection, level, type);
}

function varFromLS(dataset, variable, level, type) {
    const LS = JSON.parse(localStorage.getItem(level + "-" + variable + "var-" + type));
    const values = _.isNull(LS) ? +0 : getValues(dataset, LS);
    return ({
        "variable": LS,
        "values": values
    });
}

function listFromLS(variable) {
    const LS = JSON.parse(localStorage.getItem(variable));
    return (_.isNull(LS) ? [] : LS);
}

function updateSelection(selection, level, type) {
    if (selection.length > 0 && selection.indexOf("undefined") > -1) _.pull(selection, "undefined");

    ["color", "shape", "size"].forEach((variable) => { boldenLegend(variable, level, type) });
    localStorage.setItem(level + "selection-" + type, selection.length > 0 ? JSON.stringify(selection) : JSON.stringify(null));
    // if something is selected everything else is translucent
    d3.selectAll(".dot")
        .selectAll("path.graph")
        .style("opacity", selection.length > 0 ? 1 : 0.7)
        .classed("lighter", function (d) {
            const id = level === "model" ? "_model" : "_id";
            return (selection.length > 0 ? selection.indexOf(d[id]) === -1 : false);
        });
}

// #####################################################################################################################

// For level 2 & 3: offer different solutions if they exist
function subsetCoords(datasets, alt, model, actualAlt = null) {
    const data = datasets[alt];
    actualAlt = actualAlt === null ? alt : actualAlt;
    const subset = data.map(d => {
        const res = { "_id": d["_id"] };
        if (typeof model === "string") {
            res[actualAlt + ".x"] = d[model + ".x"] === undefined ? 0.0 : d[model + ".x"];
            res[actualAlt + ".y"] = d[model + ".y"] === undefined ? 0.0 : d[model + ".y"];
        } else {
            for (let i = 0; i < model.length; i++) {
                res[model[i] + "-" + actualAlt + ".x"] = d[model[i] + ".x"] === undefined ? 0.0 : d[model[i] + ".x"];
                res[model[i] + "-" + actualAlt + ".y"] = d[model[i] + ".y"] === undefined ? 0.0 : d[model[i] + ".y"];
            }
        }
        return (res);
    });
    return (subset);
}

function offerAlternatives(datasets, alternatives, model, type) {
    if (d3.keys(datasets).indexOf("tokens") === -1 && !_.isNull(alternatives)) {
        const storageSolution = JSON.parse(localStorage.getItem("solution-" + type));
        const chosenSolution = _.isNull(storageSolution) ? alternatives[0] : storageSolution;
        const alts = d3.select("#moveAround").append("div") // setup the dropdown for the alternatives
            .attr("class", "btn-group");
        alts.append("button")
            .attr("type", "button")
            .attr("class", "btn shadow-sm btn-marigreen dropdown-toggle")
            .attr("data-toggle", "dropdown")
            .html("<i class='fas fa-list-ul'></i> Switch solution");
        alts.append("div")
            .attr("class", "dropdown-menu")
            .attr("id", "solutions");
        buildDropdown("solutions", alternatives,
            valueFunction = d => d,
            textFunction = d => {
                return (d === chosenSolution ? "<b>" + d + "</b>" : d);
            });

        localStorage.setItem("solution-" + type, JSON.stringify(chosenSolution));
        const coords = subsetCoords(datasets, alternatives[0], model);
        for (let i = 1; i < alternatives.length; i++) {
            mergeVariables(coords, subsetCoords(datasets, alternatives[i], model))
        }
        return (coords)

    } else { // if "tokens remains"
        return (subsetCoords(datasets, "tokens", model));
    }
}

function mergeVariables(coordinates, variables) {
    coordinates.forEach((coordRow) => {
        _.assign(coordRow, variables.filter(varRow => varRow["_id"] === coordRow["_id"])[0]);
    });
}

// ########################################################################################################################
// For legend creation

function boldenLegend(variable, level, type) {
    const selection = listFromLS(variable.toLowerCase() + "sel-" + level + "-" + type);
    d3.select("#legend" + _.capitalize(variable))
        .selectAll("g.cell").each(function () {
            const label = d3.select(this);
            label.style("font-weight", function () {
                if (selection.indexOf(label.text()) === -1) {
                    return ("400");
                } else {
                    return ("700");
                }
            });
        });
}

function selectionByLegend(colorvar, shapevar, sizevar, level, type, dataset) {
    const colorSelection = listFromLS(_.join(["colorsel", level, type], "-"));
    const shapeSelection = listFromLS(_.join(["shapesel", level, type], "-"));
    const sizeSelection = listFromLS(_.join(["sizesel", level, type], "-"));
    ["color", "shape", "size"].forEach(function (x) { boldenLegend(x, level, type) });
    const id = level === "model" ? "_model" : "_id";
    console.log(colorSelection);
    console.log(shapeSelection);
    console.log(sizeSelection);
    const selection = _.uniq(dataset.filter((d) => {
        const hasColor = colorSelection.length > 0 ? colorSelection.indexOf(d[colorvar["variable"]]) !== -1 : true;
        const hasShape = shapeSelection.length > 0 ? shapeSelection.indexOf(d[shapevar["variable"]]) !== -1 : true;
        const hasSize = sizeSelection.length > 0 ? sizeSelection.indexOf(+d[sizevar["variable"]]) !== -1 : true;
        if (hasColor && hasShape && hasSize) return (d);
    }).map((d) => d[id]));
    console.log(selection);
    if (colorSelection.length + shapeSelection.length + sizeSelection.length === 0) { _.pullAll(selection, selection); }
    updateSelection(selection, level, type);
    if (level === "model") { d3.select("#numSelected").text(selection.length); }
}

function updateLegend2(settings) {
    updateLegend(settings.colorvar, settings.shapevar, settings.sizevar, settings.padding, settings.level, settings.type, settings.dataset);
}
function updateLegend(colorvar, shapevar, sizevar, padding, level, type, dataset) {
    // const legendList = [];
    d3.select(".legendBar").selectAll("svg").remove();

    const colorValues = colorvar["values"];
    const shapeValues = shapevar["values"];
    const sizeValues = sizevar["values"];
    // Update color legend
    if (_.isArray(colorValues)) {
        const colorScale = d3.scaleOrdinal()
            .domain(colorValues)
            .range(colorValues.length <= 8 ? myColors : d3.schemeSet3);
        // .range(colorValues.map(d => {
        //     return (color(colorValues.indexOf(d)));
        // }));
        // .range(d3.schemeCategory10);

        const legendColor = d3.legendColor()
            .shape("path", d3.symbol()
                .type(d3.symbolCircle)
                .size(50)())
            // .shapePadding(spaceLegend(colorValues, lCWidth))
            .scale(colorScale)
            .title(formatVariableName(colorvar["variable"]))
            .on("cellclick", function (d) {
                const colorSelection = listFromLS(_.join(["colorsel", level, type], "-"));
                colorSelection.indexOf(d) === -1 ? colorSelection.push(d) : _.pull(colorSelection, d);
                localStorage.setItem(_.join(["colorsel", level, type], "-"), JSON.stringify(colorSelection));
                selectionByLegend(colorvar, shapevar, sizevar, level, type, dataset);
            });;


        d3.select("#colorLegendContainer").append("svg")
            .style("width", d3.select(".legendBar").style("width"))
            .style("height", (colorValues.length * 25 + padding) + "px")
            // .attr("height", "100%")
            .attr("transform", "translate(0,0)")
            .attr("id", "legendColor")
            .append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + 0 + ", " + padding / 2 + ")")
            .call(legendColor);

        // legendList.push("color");

    }
    // else {
    //     if (legendList.indexOf("color") > -1) _.pull(legendList, "color");
    //     legendContainer.select("#legendColor").remove();
    // }

    // Update shape legend
    if (_.isArray(shapeValues)) {
        const shapeScale = d3.scaleOrdinal()
            .domain(shapeValues)
            .range(shapeValues.map(d => {
                return (d3.symbol().type(shape(d))());
            }));

        const legendShape = d3.legendSymbol()
            .scale(shapeScale)
            // .orient("horizontal")
            // .shapePadding(spaceLegend(shapeValues, lCWidth))
            .title(formatVariableName(shapevar["variable"]))
            .on("cellclick", function (d) {
                shapeSelection = listFromLS(_.join(["shapesel", level, type], "-"));
                shapeSelection.indexOf(d) === -1 ? shapeSelection.push(d) : _.pull(shapeSelection, d);
                localStorage.setItem(_.join(["shapesel", level, type], "-"), JSON.stringify(shapeSelection));
                selectionByLegend(colorvar, shapevar, sizevar, level, type, dataset);
            });

        // halign = legendList.indexOf("color") == -1 ? 0 : 150;

        d3.select("#shapeLegendContainer").append("svg")
            .style("width", d3.select(".legendBar").style("width"))
            .style("height", (shapeValues.length * 30 + padding) + "px")
            // .attr("height", "100%")
            .attr("transform", "translate(0,0)")
            .attr("id", "legendShape")
            .append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + 0 + ", " + padding / 2 + ")")
            .call(legendShape);

        // legendList.push("shape");

    } 
    // else {
    //     if (legendList.indexOf("shape") > -1) _.pull(legendList, "shape");
    //     legendContainer.select("#legendShape").remove();
    // }

    // Update size legend
    if (_.isArray(sizeValues)) {

        const sizeScale = d3.scaleLinear()
            .domain(d3.extent(sizeValues))
            .range([5, 8]);
        const smallNumbers = (sizeScale.domain()[1] - sizeScale.domain()[0]) / (sizeValues.length - 1) < 1;

        const legendSize = d3.legendSize()
            .shape("circle")
            // .orient("horizontal")
            // .shapePadding(20)
            .labelOffset(15)
            .scale(sizeScale)
            .title(formatVariableName(sizevar["variable"]))
            .cells((sizeValues.length > 6 || smallNumbers) ? 5 : sizeValues.length)
            .labelFormat(smallNumbers ? ".04r" : ".0d")
            .on("cellclick", function (d) {
                if (sizeValues.length <= 6) {
                    sizeSelection = listFromLS(_.join(["sizesel", level, type], "-"));
                    sizeSelection.indexOf(d) === -1 ? sizeSelection.push(d) : _.pull(sizeSelection, d);
                    localStorage.setItem(_.join(["sizesel", level, type], "-"), JSON.stringify(sizeSelection));
                    selectionByLegend(colorvar, shapevar, sizevar, level, type, dataset);
                }
            });

        d3.select("#sizeLegendContainer").append("svg")
            .style("width", d3.select(".legendBar").style("width"))
            // .style("height", (300 + padding) + "px")
            // .attr("height", "100%")
            .attr("transform", "translate(0,0)")
            .attr("id", "legendSize")
            .append("g")
            .attr("class", "legend")
            .attr("transform", "translate(" + 0 + ", " + padding / 2 + ")")
            .call(legendSize);

        // legendList.push("size");

    } 
    // else {
    //     if (legendList.indexOf("size") > -1) _.pull(legendList, "size");
    //     legendContainer.select("#legendSize").remove();
    // }

    // if (legendList.length > 0) {
        // legendContainer.selectAll("svg")
        // .call(responsivefy);
        ["color", "shape", "size"].forEach(function (x) { boldenLegend(x, level, type) });
    // }
}