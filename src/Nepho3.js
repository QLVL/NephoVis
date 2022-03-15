class NephoVisLevel3 extends NephoVis {
	constructor(level, type, model, selection=null) {
		super(level, type, selection);
		this.model = model;
	}

	execute() {
		// Set the current dimension reduction solution to simply be the first one
		this._chosenSolution = this.dataLoader.alternatives[0];

		// Build the switcher which allows you to switch between dimension reduction solutions
		this.buildSolutionSwitchDropdown();

		// Initialise all variables
		this.initVars();

		this.importSelection();

		// todo: setup texts

		this.contextVar = null; // todo: what is this?

		this.initTailoredVars();
		this.initContextWordsColumn();
	}

	buildTokenDataset() {
		// Merge all different dimension reduction solutions into one dataset
		this.dataLoader.datasets["tokens"] = this.mergeSolutions();

		// Infuse the tokens dataset with variables information
		this.dataLoader.datasets["tokens"] = Helpers.mergeVariables(this.dataLoader.datasets["tokens"],
																	this.dataLoader.datasets["variables"]);
	}

	initTailoredVars() {
		this.dataProcessor.tailoredContexts = this.dataProcessor.contexts
			// TODO: I find this a very hacky solution, 
			// because we don't prescribe what patterns model names should adhere to
			.filter((context) => {
				let firstDotIndex = context.indexOf(".");
				return (context.split(".").length == 2 || this.model.includes(context.substring(firstDotIndex + 1)))
			})
			.map((context) => {
				let splitContext = context.split(".");
				return {
					"key": splitContext.length == 2 ? splitContext[1] : "model",
					"value": context
				};
			});

		this.dataProcessor.tailoredNumerals = this.dataProcessor.numeralNames
			.filter((context) => {
				let firstDotIndex = context.indexOf(".");
				return (!context.startsWith("_count") || this.model.includes(context.substring(firstDotIndex + 1)))
			})
			.map((context) => {
				let splitContext = context.split(".");
				return {
					"key": context.startsWith("_count") ? "number of foc" : context,
					"value": context
				};
			});
		// These last lines are only if you use the "ctxt2" dropdown instead of "ctxt" (for tailored contexts, that is, matched to the cloud)
	}

	initContextWordsColumn() {
		this.dataProcessor.contextWordsColumn = this.dataProcessor.columnNames.filter((columnName) => {
			// TODO: WHAT is this magic number???
			return (columnName.startsWith("_cws") && this.model.includes(columnName.slice(5)));
		});
	}

	buildSolutionSwitchDropdown(update=false) {
		// Build solution switcher only if there are multiple solutions
		if (this.dataLoader.alternatives != null) {
			if (this.dataLoader.alternatives > 1) {
				UserInterface.buildSolutionSwitchDropdown("moveAround", this.dataLoader.alternatives,
													  (solution) => { return solution == this.chosenSolution ?
													  				  		`<b>${solution}</b>` :
													  				  		solution },
													  (solution) => { this.chosenSolution = solution; },
													  update);
			}
		}
	}

	mergeSolutions() {
		// TODO: how can tokens be in the datasets if we always remove it if it's there?
		if (!("tokens" in this.dataLoader.datasets) && this.dataLoader.alternatives != null) {

			// todo: I think this needs to be chosen solution?
			let coordinates = this.subsetCoordinates(this.dataLoader.alternatives[0]);

			for (let i = 1; i < this.dataLoader.alternatives.length; i++) {
				let alternativeCoordinates = this.subsetCoordinates(this.dataLoader.alternatives[i]);
				coordinates = Helpers.mergeVariables(coordinates, alternativeCoordinates);
			}

			return coordinates;
		// Old dataset layout?
		} else {
			return this.subsetCoordinates("tokens");
		}
	}

	// For level 2 & 3: offer different solutions if they exist
	subsetCoordinates(solution) {
		// Pick the data specific to this solution
		let data = this.dataLoader.datasets[solution];

		// todo: "actual alt" implementation
		let actualSolution = solution;

		let subset = data.map((row) => {
			let res = { "_id": row["_id"] };

			// How can this be a list?
			if (typeof this.model == "string") {
				res[`${actualSolution}.x`] = row[`${this.model}.x`] === undefined ? 0.0 : row[`${this.model}.x`];
				res[`${actualSolution}.y`] = row[`${this.model}.y`] === undefined ? 0.0 : row[`${this.model}.y`];
			}
			else {
				// todo implement list-based models
				alert("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
			}

			return res;
		});

		return subset;
	}

	get chosenSolution() {
		return this._chosenSolution;
	}

	set chosenSolution(solution) {
		this._chosenSolution = solution;
		this.buildSolutionSwitchDropdown(true);
	}
}