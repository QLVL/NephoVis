class NephoVisLevel2 extends NephoVisLevel23Common {
	constructor(level, type, selection=null) {
		super(level, type, selection);

		this.centralDataset = "tokens";

		// How many models should be kept from a large selection?
		this.truncateUpperBound = 9;
		this.dimensions = { "width": 250,
							"height": 250,
							"padding": 20 };

		// Plot specifications
		this.columnsCount = 3; // TODO: should this be responsive?

		// Tooltip for the miniplots
		this.tooltip = new Tooltip(d3.select("body"), 20);
	}

	execute() {
		// First, initialise the variables just enough so we can import only the model selection
		this.initVarsSimple();
		this.importSelection(true);

		this.model = this.modelSelection.models;

		// In the common level 2-3 class, execute will create the token dataset
		// This token dataset is based on the model selection, which is why we need to import it
		// before we can start creating the token dataset, which is needed for the variable initalisation
		super.execute();

		// Now, we can continue variable initialisation
		this.initVarsContinued();

		/* Create another data processor for the "models" dataset */
		this.dataProcessorModels = new DataProcessor(this.dataLoader.datasets, "models");

		// To colour the emblems, we need to define a new datapoint style
		this.dataPointStyles["emblem"] = new DataPointStyle(this.level,
															"emblem",
															this.dataProcessorModels.nominalNames);

		this.importSelection();

		/* No models in model selection */
		if (this.modelSelection.models.length == 0) {
			// TODO: do something at this point
			// but: this shouldn't happen, because level 1 should prevent you from expanding
			console.log("No models in selection.")
		}
		else if (this.modelSelection.models.length > this.truncateUpperBound) {
			console.log("Truncating models");
			let toast = new NephoToast("warn", "Too many models selected",
				"You have selected too many models. Only the first 9 will be used.");

			this.modelSelection.truncate(this.truncateUpperBound);
		}

		this.itemSelection = this.tokenSelection;

		this.buildSolutionSwitchDropdown();

		UserInterface.prepareUI(this.level, this.type);

		this.buildInterface();
		this.drawPlot();

		this.updateUrl();

		if (this.dataLoader.unavailableFiles.includes("variables")) {
			new NephoToast("info", "Frequency table disabled",
			`<code>${this.type}.variables.tsv</code> not found. Frequency table will be disabled.`);
		}


		if (this.dataLoader.unavailableFiles.includes("modelsdist")) {
			new NephoToast("info", "Distance matrix disabled",
			`<code>${this.type}.modelsdist.tsv</code> not found. Distance matrix will be disabled.`);
		}
	}

	initVarsContinued() {
		super.initVarsContinued();

		let tokenSelectionUpdateCallback = () => { this.afterTokenRestore(); };

		this.tokenSelection = new TokenSelection(tokenSelectionUpdateCallback);
	}

	buildInterface() {
		super.buildInterface();

		UserInterface.setLevel2Headers(this.chosenSolution);

		UserInterface.setButton("clearSelect", () => 
			{
				this.tokenSelection.clear();
			});

		UserInterface.setButton("toLevel1", () => 
			{
				window.location.href = router.router.generate("model.type.selection",
													  { type: this.type,
													  	selection: this.selection });
			});

		console.log(this.dataProcessorModels.nominalNames.length);

		// Build the model colour dropdown
		// This is the dropdown which gives all the emblems
		// in the leftmost corner their colours
		UserInterface.buildDropdown("emblem",
									this.dataProcessorModels.nominalNames,
									variable => 
										{ this.handleDropdownChange("emblem", variable); },
									UserInterface.formatVariableName,
									d => d,
									this.dataProcessorModels.nominalNames.length <= 1);

		UserInterface.setButton("showTable", (event) => {
			let windowWidth = this.modelSelection.models.count * 100 + 400;

			let params = `width=${windowWidth},height=700,menubar=no,toolbar=no,location=no,status=no`;
			window.open(router.router.generate("cws.type.selection", 
												{ type: this.type,
												  selection: this.selection }),
						"cws",
						params);
		},
		null,
		this.dataLoader.unavailableFiles.includes("variables"));

		UserInterface.setButton("showMatrix", (event) => {
			let params = "width=650,height=650,menubar=no,toolbar=no,location=no,status=no";
			window.open(router.router.generate("distance.type.selection", 
												{ type: this.type,
												  selection: this.selection }),
						"distance",
						params);
		},
		null,
		this.dataLoader.unavailableFiles.includes("modelsdist"));

		UserInterface.buildDropdown("models",
									this.modelSelection.models,
									model => this.onModelClick(model));
	}

	showTooltip(model) {
		this.tooltip.show(model,
						  d3.event.pageY,
						  d3.event.pageX,
						  parseFloat(d3.select("body").style("width")));
	}

	hideTooltip() {
		this.tooltip.hide();
	}

	switchSolution() {
		UserInterface.setLevel2Headers(this.chosenSolution);

		this.plots.forEach(plot => { 
			plot.destroyBrush();
			plot.switchSolution(this.chosenSolution);
		});

		super.switchSolution();
	}

	drawPlot() {
		this.plots = [];

		let miniPlotContainer = d3.select("#miniPlots");

		this.modelSelection.models.forEach((model, index) => {
			let miniPlotId = `miniPlot-${index}`;
			let miniPlotDiv = miniPlotContainer.append("div")
											   .attr("id", miniPlotId)
											   .attr("class", "miniSvg");

			let lostTokenObject = this.getLostNonLostTokens(`${model}-${this.chosenSolution}`);

			let mouseClickFunction = this.mouseClickPoint.bind(this);
			let mouseOverFunction = this.mouseOver.bind(this);
			let mouseOutFunction = this.mouseOut.bind(this);

			let showTooltipFunction = this.showTooltip.bind(this);
			let hideTooltipFunction = this.hideTooltip.bind(this);

			let brushStartFunction = this.brushStart.bind(this);
			let onBrushFunction = this.onBrush.bind(this);
			let brushEndFunction = this.brushEnd.bind(this);

			let selectionByLegendFunction = this.selectionByLegend.bind(this);
			let onModelClickFunction = this.onModelClick.bind(this);

			let miniPlot = new MiniPlot(this.level,
										miniPlotId,
										model,
										this.dimensions,
										lostTokenObject["nonLostTokens"],
										lostTokenObject["lostTokens"],
										this.dataProcessor.datasets["models"],
										this.chosenSolution,
										this.contextVar,
										this.dataPointStyles,
										this.modelSelection,
										this.tokenSelection,
										this.variableSelection,
										mouseClickFunction, 
										mouseOverFunction, 
										mouseOutFunction,
										showTooltipFunction,
										hideTooltipFunction,
										brushStartFunction,
										onBrushFunction, 
										brushEndFunction,
										selectionByLegendFunction,
										onModelClickFunction,
										index == 0) // only first plot should invoke legend drawing call; 
			this.plots.push(miniPlot);
		});
	}

	brushStart(model) {
		// If we're still brushing the same plot, no action is needed
		if (this.currentBrushPlot != model) {
			// If this is the first brush, no action is needed
			if (this.currentBrushPlot != null) {
				// If this is a second+ brush, get the index of the previous plot
				let plotIndex = this.modelSelection.models.indexOf(this.currentBrushPlot);
				// Then, destroy its brush
				this.plots[plotIndex].hideBrush();
			}

			// Update the currently brushing plot
			this.currentBrushPlot = model;
		}
	}

	onBrush(tokens) {
		this.tokenSelection.restore(tokens);
		this.afterTokenRestore(false);
	}

	brushEnd(tokens) {
		this.tokenSelection.restore(tokens);
		this.afterTokenRestore();
	}

	afterTokenRestore(doUpdateUrl=true) {
		this.plots.forEach(plot => {
			plot.updateSelection(this.tokenSelection);
		});

		if (doUpdateUrl) {
			this.updateUrl();
		}
	}

	brushToggle() {
		if (this.brushActive)
		{
			this.plots.forEach(plot => {
				plot.applyBrush();
			});

			
		} else {
			d3.selectAll(".brush").remove();
		}
	}

	mouseOver(tokenId) {
		this.plots.forEach(plot => plot.highlightPointFromPointIndex(tokenId));
	}

	mouseOut() {
		this.plots.forEach(plot => plot.mouseOut(false));
	}

	onModelClick(modelId) {
		let url = router.router.generate("token.type.model.selection",
										{ type: this.type,
											model: modelId,
											selection: this.selection });
		UserInterface.openTab(url);
	}

	updateUrl() {
		super.updateUrl();
		window.location.href = router.router.generate("aggregate.type.selection",
													  { type: this.type,
													  	selection: this.selection });
	}
}