class NephoVisLevel3 extends NephoVis {
	constructor(level, type, model, selection=null) {
		super(level, type, selection);
		this.model = model;
	}

	execute() {
		// Set the current dimension reduction solution to simply be the first one
		this._chosenSolution = this.dataLoader.alternatives[0];

		this.buildSolutionSwitchDropdown();
		// Merge all different dimension reduction solutions into one dataset
		this.dataLoader.datasets["tokens"] = this.mergeSolutions();
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