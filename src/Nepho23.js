class NephoVisLevel23Common extends NephoVis {
	constructor(level, type, selection=null) {
		super(level, type, selection);
	}

	execute() {
		// Set the current dimension reduction solution to simply be the first one
		this._chosenSolution = this.dataLoader.alternatives[0];

		this.buildTokenDataset();
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
		this.dataLoader.datasets["tokens"] = Helpers.mergeVariables(this.dataLoader.datasets["tokens"],
																	this.dataLoader.datasets["variables"]);

		// Find lost tokens (and non lost tokens)
		this.dataLoader.datasets["nonLostTokens"] = this.dataLoader.datasets["tokens"].filter(row =>
			Helpers.existsFromColumn(row, this.chosenSolution));
		this.dataLoader.datasets["lostTokens"] = this.dataLoader.datasets["tokens"].filter(row =>
			!Helpers.existsFromColumn(row, this.chosenSolution));
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

		// todo: "actual alt" implementation
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
}