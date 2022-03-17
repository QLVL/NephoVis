class ModelPlot extends Plot {
	constructor(level, targetElementName, dimensions, dataset, dataPointStyles,
				modelSelection, variableSelection, onDataPointClick, selectionByLegend) {
		super(level, targetElementName, dimensions, dataset, dataPointStyles,
				modelSelection, variableSelection, onDataPointClick, selectionByLegend);

		this.initPlot();
	}

	initPlot() {
		// set tooltip and pointer events
		// todo: this is different for level 2
		this.setTooltip(this.targetElement);

		super.initPlot();
	}

	setAxes() {
		this.coordinatesSource = "model";

		super.setAxes();
	}

	generatePointCloud() {
		super.generatePointCloud();
	}

	mouseOverPoint(row, pointElement) {
		// Update svg container reference
		this.svgContainer = d3.select(".svgPlot");

		// Reconstruct the coordinates from point inderx
		let position = this.pointCloudCoordinates[+pointElement.attr("pointIndex")];

		let svgDimensions = { "width": parseFloat(this.svgContainer.style("width")),
							  "height": parseFloat(this.svgContainer.style("height")) };

		// The plot is actually scaled depending on the screen size
		// We compute the actual "real" absolute coordinates
		let realCoordinates = [ svgDimensions["width"] / this.dimensions["width"] * position[0],
								svgDimensions["height"] / this.dimensions["height"] * position[1] ];

		// --- TOOLTIP ---

		// Clear tooltip hide timeout
		clearTimeout(this.tooltipHideTimeout);

		// Show the tooltip
		this.tooltip.transition()
					.duration(200)
					.style("opacity", 1)
					.style("display", "block");

		// Check for each data point style whether there is a variable attached to it
		// If there is, generate the required tooltip text
		let tooltipData = [];
		for (let dataPointStyleName in this.dataPointStyles) {
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];
			let tooltipRow = dataPointStyle.variable == null ? 
							 "" :
							 `<br><strong>${dataPointStyle.variable}: ${dataPointStyle.format(row[dataPointStyle.variable])}</strong>`;
			tooltipData.push(tooltipRow);
		}
	
		let tooltipContent = `<strong>${row["_model"]}</strong>` + tooltipData.join("");

		// Create the tooltip first (we need its width to position it)
		this.tooltip.html(tooltipContent)
			 	    .style("top", realCoordinates[1] + "px");

		// Determine the tooltip location
		let tooltipLeftCoordinate = position[0];
		let tooltipWidth = parseInt(this.tooltip.style("width"));
		// If there isn't enough room to show the tooltip
		if (svgDimensions["width"] - position[0] < tooltipWidth) {
			// Adjust the tooltip position
			tooltipLeftCoordinate = Math.max(0, (position[0] - tooltipWidth)) + "px";
		}

		// Adjust the left coordinate
		this.tooltip.style("left", tooltipLeftCoordinate);

		this.highlightPoint(pointElement);
	}
}