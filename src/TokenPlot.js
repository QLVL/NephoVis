class TokenPlot extends Plot {
	constructor(level, targetElementName, dimensions, dataset, chosenSolution, target, contextVar,
				tailoredContexts,
				dataPointStyles, modelSelection, variableSelection, onDataPointClick, selectionByLegend) {
		super(level, targetElementName, dimensions, dataset, dataPointStyles,
				modelSelection, variableSelection, onDataPointClick, selectionByLegend);
		this.chosenSolution = chosenSolution;
		this.target = target;
		this.originalDataset = this.dataset;
		this.contextVar = contextVar;
		this.tailoredContexts = tailoredContexts;

		this.initPlot();
	}

	initPlot() {
		// Delete all lost token overviews
		d3.selectAll(".lost").remove();

		super.initPlot();

		this.generateLostTokens();
	}

	setAxes() {
		this.coordinatesSource = this.chosenSolution;

		super.setAxes();
	}

	generatePointCloud() {
		// "dataset" should only contain non-lost tokens
		this.dataset = this.originalDataset.filter(row => Helpers.exists(row, this.coordinateColumns));
		// lost tokens contains... lost tokens
		this.lostTokens = this.originalDataset.filter(row => !Helpers.exists(row, this.coordinateColumns));

		super.generatePointCloud();
	}

	mouseOverPoint(row, pointElement) {
		this.highlightPoint(pointElement);

		this.showContext(row, pointElement);
	}

	mouseOut() {
		super.mouseOut();
		d3.select("#concordance").select("p").remove();
      	d3.selectAll(".selector").remove();
	}

	showContext(row, pointElement) {
		let tooltipColour = this.codePoint(row, this.dataPointStyles["colour"]);

		// todo ? ? ? 
		let contextVar = this.contextVar || "_ctxt.raw";

		// ? ? ? ?
		if (this.tailoredContexts.filter(context => context.value == contextVar).length == 0)
		{
			// todo, I don't know what this is or what it should do
		}

		let tooltipTitle = `<p><b>${row["_id"]}</b></p><p>`;
		let tooltipInfo = row[contextVar].replace(/class=["']target["']/g,
							`style="color:${tooltipColour};font-weight:bold;"`) + "</p>";

		d3.select("#concordance")
		  .append("p")
		  .attr("class", "text-center p-2 ml-2")
		  .style("border", "solid")
		  .style("border-color", "gray")
		  .style("font-size", "0.8em")
		  .html(tooltipTitle + tooltipInfo);
	}

	generateLostTokens() {
		// Don't draw any lost tokens if there aren't any
		if (this.lostTokens.length == 0) {
			return
		}

		// Ready the sidebar for lost tokens
		let lostTokensSidebar = d3.select(".sidebar")
								  .append("div")
								  //.attr("id", `#lost${}`); ? ? ?
								  .attr("id", "lost")
								  .classed("lost", true);

		let sidebarWidth = parseInt(lostTokensSidebar.style("width"));
		// todo: dots per row doesn't scale when sidebar width is changed	
	    let dotsPerRow = Math.floor((sidebarWidth - 20) / 10);
	    let dotsColumns = Math.ceil(this.lostTokens.length / dotsPerRow);

	    let lostItem = "TODO" // tokens or FOCs?

	    // Add DOM elements
	    lostTokensSidebar.append("hr");
	    lostTokensSidebar.append("h5")
	    	   			 .text(`Lost ${this.target}`);

	   	// Add the lost tokens
    	let tokens = lostTokensSidebar.append("svg")
      					 .attr("width", sidebarWidth)
      					 .attr("height", dotsColumns * 10 + this.dimensions["padding"] / 2)
      					 .attr("transform", "translate(0,0)")
      					 .append("g")
      					 .attr("transform", `translate(${10},${10})`)
      					 .attr("class", "dot")
      					 .selectAll("path")
      					 .data(this.lostTokens)
      					 .enter()
      					 .append("path")
      					 .attr("class", "graph lost")
      					 .attr("transform", (row) => {
      		   				let j = Math.floor(this.lostTokens.indexOf(row) / dotsPerRow);
        					let i = this.lostTokens.indexOf(row) - (j * dotsPerRow);
        					return (`translate(${i * 10},${j * 10})`);
      					 });
      		   //.call(styleDot, settings, target);

      	this.stylePoints(tokens);
	}
}