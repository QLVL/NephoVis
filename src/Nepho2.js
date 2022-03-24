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

		this.importSelection();

		/* No models in model selection */
		if (this.modelSelection.models.length == 0) {
			// TODO: do something at this point
			// but: this shouldn't happen, because level 1 should prevent you from expanding
			console.log("No models in selection.")
		}
		else if (this.modelSelection.models.length > this.truncateUpperBound) {
			console.log("Truncating models");
			// TODO: alerts are really bad UI
			// find some toast library and use that
			//window.alert("You have selected too many models, only the first 9 will be used.");
			this.modelSelection.truncate(this.truncateUpperBound);
		}

		/* Create another data processor for the "models" dataset */
		this.dataProcessorModels = new DataProcessor(this.dataLoader.datasets, "models");

		this.buildSolutionSwitchDropdown();

		this.buildInterface();
		this.drawPlot();
	}

	buildInterface() {
		super.buildInterface();

		// Build the model colour dropdown
		// This is the dropdown which gives all the emblems
		// in the leftmost corner their colours
		UserInterface.buildDropdown("modelColour",
									this.dataProcessorModels.nominalNames,
									() => { this.handleModelColourChange(); },
									UserInterface.formatVariableName);

		// TODO: build model switcher
	}

	handleModelColourChange() {
		// todo: "colour circles"
	}

	switchSolution() {
		// todo
	}

	drawPlot() {
		this.plots = [];

		/*this.modelSelection.models.forEach((model, index) => {
			// TODO: I have NO clue what we're doing with lost tokens here
			let lostTokenCount = this.getLostNonLostTokens(`${m}-${chosenSolution}`)["lostTokens"].length;
			let lostColumns = lostTokenCount / 25 < 1 ?
							  2 :
							  Math.ceil(lostTokenCount / 25);

			// todo: find more descriptive name
			// also: WHAT ARE THESE MAGIC NUMBERS
			// I think this is all unnecessary since layouting is done with FLEX now
			let j = Math.floor(index / this.columnsCount);
			let i = index - this.columnsCount * Math.floor(index / this.columnsCount);
			let columnsCount = lostColumns / 2;

			let solutionScales = {};

			this.alternatives.forEach(solution => solutionScales[solution] = )
		});*/

		let miniPlotContainer = d3.select("#miniPlots");

		this.modelSelection.models.forEach((model, index) => {
			let miniPlotId = `miniPlot-${index}`;
			let miniPlotDiv = miniPlotContainer.append("div")
											   .attr("id", miniPlotId)
											   .attr("class", "miniSvg");

			let lostTokenObject = this.getLostNonLostTokens(`${model}-${this.chosenSolution}`);

			let miniPlot = new MiniPlot(this.level,
										miniPlotId,
										model,
										this.dimensions,
										lostTokenObject["nonLostTokens"],
										this.chosenSolution,
										this.contextVar,
										this.dataPointStyles,
										this.modelSelection,
										this.tokenSelection,
										this.variableSelection,
										() => { }, // todo datapointclick 
										() => { }, // todo brushEndCallback
										() => { }); // todo selectionByLegend
			this.plots.push(miniPlot);
		});

		// todo: miniSvg remove (is this necessary?)
		// todo: brush and brush toggle
	}
}