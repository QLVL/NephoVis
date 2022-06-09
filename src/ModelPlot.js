class ModelPlot extends Plot {
	constructor(level,
				targetElementName,
				dimensions,
				dataset,
				dataPointStyles,
				modelSelection,
				variableSelection,
				onDataPointClick,
				selectionByLegend) {

		super(level,
			  targetElementName,
			  dimensions,
			  dataset,
			  dataPointStyles,
			  modelSelection,
			  variableSelection,
			  onDataPointClick,
			  selectionByLegend);

		this.appendSvg();
		
		this.idColumn = "_model";
		this.selection = this.modelSelection;

		this.initPlot();
	}

	initPlot() {
		// set tooltip and pointer events
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

	generateTooltipContent(row) {
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

		return tooltipContent;
	}

	mouseOverPoint(row, pointElement) {
		this.showTooltip(row, pointElement);
		this.highlightPoint(pointElement);
	}

	mouseOut() {
		super.mouseOut();
		this.hideTooltip();
	}

	updateSelection() {
		// Todo: check how something of "undefined" can end up here
		// I'll just mirror its functionality for now
		if (this.modelSelection.count > 0 && this.modelSelection.models.includes("undefined")) {
			this.modelSelection = this.modelSelection.filter((model) => { model != "undefined" });
		}

		super.updateSelection();
	}

	isPointSelected(row) {
		if (this.modelSelection.models.length > 0)
		{
			return this.modelSelection.models.includes(row["_model"]);
		}

		return true;
	}
}