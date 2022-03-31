class NephoVisLevel23Common extends NephoVis {
	constructor(level, type, selection=null) {
		super(level, type, selection);
	}

	execute() {
		// Set the current dimension reduction solution to simply be the first one
		this._chosenSolution = this.dataLoader.alternatives[0];

		// The context variable dictates what context column should be consulted on hover
		this.contextVar = "_ctxt.raw";

		this.buildTokenDataset();

		this.currentBrushPlot = null;
	}

	buildTokenDataset() {
		// We first have to build the focdists, because there is a check for tokens in this method
		// It will fail if we do focdists second. Don't worry about it, it's an implementation thing.
		if (this.dataLoader.includesFOC) {
			// Merge all different dimension reduction solutions into one dataset (context words)
			this.dataLoader.datasets["focdists"] = this.mergeSolutions(true);
			// We DON'T infuse the focdists dataset with variables information

			// Find lost focdists (and non lost focdists)
			this.dataLoader.datasets["nonLostFocdists"] = this.dataLoader.datasets["focdists"].filter(row =>
				Helpers.existsFromColumn(row, `${this.chosenSolution}cws`));
			this.dataLoader.datasets["lostFocdists"] = this.dataLoader.datasets["focdists"].filter(row =>
				!Helpers.existsFromColumn(row, `${this.chosenSolution}cws`));
		}

		// Merge all different dimension reduction solutions into one dataset
		this.dataLoader.datasets["tokens"] = this.mergeSolutions();

		// Infuse the tokens dataset with variables information
		// This is only possible if "variables" is available

		if (!this.dataLoader.unavailableFiles.includes("variables")) {
			this.dataLoader.datasets["tokens"] = Helpers.mergeVariables(this.dataLoader.datasets["tokens"],
																		this.dataLoader.datasets["variables"]);
		}

		if (this.level == "token") {
			let lostTokenObject = this.getLostNonLostTokens(this.chosenSolution);

			// Find lost tokens (and non lost tokens)
			this.dataLoader.datasets["nonLostTokens"] = lostTokenObject["nonLostTokens"];
			this.dataLoader.datasets["lostTokens"] = lostTokenObject["lostTokens"];
		}
	}

	getLostNonLostTokens(column) {
		return { "lostTokens": this.dataLoader.datasets["tokens"].filter(row =>
					!Helpers.existsFromColumn(row, column)),
				 "nonLostTokens": this.dataLoader.datasets["tokens"].filter(row =>
					Helpers.existsFromColumn(row, column)) };
	}

	mergeSolutions(contextWords=false) {
		// TODO: how can tokens be in the datasets if we always remove it if it's there?
		if (!("tokens" in this.dataLoader.datasets) && this.dataLoader.alternatives != null) {

			// todo: I think this needs to be chosen solution?
			let coordinates = this.subsetCoordinates(this.dataLoader.alternatives[0], contextWords);

			for (let i = 1; i < this.dataLoader.alternatives.length; i++) {
				let alternativeCoordinates = this.subsetCoordinates(this.dataLoader.alternatives[i], contextWords);
				coordinates = Helpers.mergeVariables(coordinates, alternativeCoordinates);
			}

			return coordinates;
		// Old dataset layout?
		} else {
			return this.subsetCoordinates("tokens", contextWords);
		}
	}

	// For level 2 & 3: offer different solutions if they exist
	subsetCoordinates(solution, contextWords=false) {
		solution = !contextWords ? solution : `${solution}cws`;

		console.log(solution);

		// Pick the data specific to this solution
		let data = this.dataLoader.datasets[solution];

		let actualSolution = solution;

		let subset = data.map((row) => {
			let res = { "_id": row["_id"] };

			// How can this be a list?
			// This is a list in level 2!
			if (typeof this.model == "string") {
				res[`${actualSolution}.x`] = row[`${this.model}.x`] === undefined ? 0.0 : row[`${this.model}.x`];
				res[`${actualSolution}.y`] = row[`${this.model}.y`] === undefined ? 0.0 : row[`${this.model}.y`];
			}
			else {
				for (let i = 0; i < this.model.length; i++) {
					res[this.model[i] + "-" + actualSolution + ".x"] = row[this.model[i] + ".x"] === undefined ? 
																  	   0.0 : 
																  	   row[this.model[i] + ".x"];
                	res[this.model[i] + "-" + actualSolution + ".y"] = row[this.model[i] + ".y"] === undefined ? 
                												  	   0.0 : 
                												 	   row[this.model[i] + ".y"];
				}
			}

			return res;
		});

		return subset;
	}

	/* -- USER INTERFACE -- */

	buildInterface() {
		this.buildStyleDropdowns();
		this.buildBrushOrClick();
	}

	/* Build the data style switcher dropdowns */
	buildStyleDropdowns() {
		// We build the dropdowns for the styles automatically
		for (let dataPointStyleName in this.dataPointStyles)
		{
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];
			UserInterface.buildDropdown(dataPointStyleName, dataPointStyle.candidates,
										(variable) => 
										{ this.handleDropdownChange(dataPointStyleName, variable); },
										dataPointStyle.textFunction,
										dataPointStyle.valueFunction);
		}
	}

	// Build the switcher which allows you to switch between dimension reduction solutions
	buildSolutionSwitchDropdown(update=false) {
		// Build solution switcher only if there are multiple solutions
		if (this.dataLoader.alternatives != null) {
			if (this.dataLoader.alternatives.length > 1) {
				UserInterface.buildSolutionSwitchDropdown("moveAround", this.dataLoader.alternatives,
													  (solution) => { return solution == this.chosenSolution ?
													  				  		`<b>${solution}</b>` :
													  				  		solution },
													  (solution) => { this.chosenSolution = solution; },
													  update);
			}
		}
	}

	buildBrushOrClick() {
		let brushOrClickSwitchers = document.querySelectorAll('input[name="selection"]');

		brushOrClickSwitchers.forEach(brushOrClickSwitcher => {
			brushOrClickSwitcher.onchange = (event) => {
				let selectedFunction = event.target.value;
				this.brushActive = selectedFunction == "brush";
			} 
		});
	}

	/* -- GETTERS AND SETTERS -- */

	// .chosenSolution

	get chosenSolution() {
		return this._chosenSolution;
	}

	set chosenSolution(solution) {
		this._chosenSolution = solution;
		this.buildSolutionSwitchDropdown(true);
		this.switchSolution();
		this.updateUrl();
	}

	// .brushActive

	get brushActive() {
		return this._brushActive;
	}

	set brushActive(brushActive) {
		this._brushActive = brushActive;
		this.brushToggle();
	}

	/* -- OTHER -- */
	switchSolution() {
		//this.brushActive = false;

		this.brushToggle();
	}

	importSelection(simple=false) {
		let decodedExport = super.importSelection(simple);

		if (decodedExport == null) {
			return;
		}

		if ("tokenSelection" in decodedExport) {
			this.tokenSelection.restore(decodedExport["tokenSelection"]);
		}

		if ("chosenSolution" in decodedExport) {
			this.restoreChosenSolution(decodedExport["chosenSolution"]);
		}
	}

	mouseClickPoint(row, pointElement) {
		// We manually add a token to the token selection
		// Or, if it's already in the model selection, we remove it
		this.tokenSelection.toggle(row["_id"]);
	}

	selectionByLegend(variable, value) {
		super.selectionByLegend(variable, value);

		// Redraw the plot
		this.afterTokenRestore();
	}

	restoreChosenSolution(chosenSolution) {
		this._chosenSolution = chosenSolution;
	}

	updateUrl() {
		super.updateUrl();
	}
}