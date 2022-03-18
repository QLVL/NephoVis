class NephoVisLevel3 extends NephoVis {
	constructor(level, type, model, selection=null) {
		super(level, type, selection);
		this.model = model;
		this.centralDataset = "tokens";
		this.brush = null;
		this.brushActive = false;

		this.dimensions = { "width": 600,
							"height": 600,
							"padding": 40 };
	}

	execute() {
		// Set the current dimension reduction solution to simply be the first one
		this._chosenSolution = this.dataLoader.alternatives[0];

		// Build the switcher which allows you to switch between dimension reduction solutions
		this.buildSolutionSwitchDropdown();

		this.buildTokenDataset();

		// Initialise all variables
		this.initVars();

		this.importSelection();

		this.itemSelection = this.tokenSelection;

		// todo: setup texts

		// The context variable dictates what context column should be consulted on hover
		this.contextVar = "_ctxt.raw";

		this.buildInterface();

		this.drawPlot();
	}

	buildTokenDataset() {
		// We first have to build the focdists, because there is a check for tokens in this method
		// It will fail if we do focdists second. Don't worry about it, it's an implementation thing.
		if (this.dataLoader.includesFOC) {
			// Merge all different dimension reduction solutions into one dataset (context words)
			this.dataLoader.datasets["focdists"] = this.mergeSolutions(true);
			// We DON'T infuse the focdists dataset with variables information
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

		// Find lost focdists (and non lost focdists)
		this.dataLoader.datasets["nonLostFocdists"] = this.dataLoader.datasets["focdists"].filter(row =>
			Helpers.existsFromColumn(row, `${this.chosenSolution}cws`));
		this.dataLoader.datasets["lostFocdists"] = this.dataLoader.datasets["focdists"].filter(row =>
			!Helpers.existsFromColumn(row, `${this.chosenSolution}cws`));
	}

	initVars() {
		super.initVars();

		let tokenSelectionUpdateCallback = () => { this.afterTokenRestore(); };
		this.tokenSelection = new TokenSelection(tokenSelectionUpdateCallback);
		this.contextWordSelection = new TokenSelection(() => {});
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

	buildInterface() {
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

		UserInterface.setButton("clearSelect", () => 
			{
				this.tokenSelection.clear();
				this.contextWordSelection.clear();
			});

		UserInterface.setButton("findTokensContextBtn", (event) => {
			let needle = document.getElementById("findTokensByContext").value;
			this.selectByContextSearch(needle, this.contextVar,
				(needle) => `Sorry, "${needle}" is not present in a concordance in this model.`);
		});

		// For some reason, the context word column can be a list
		// I don't know how that works as an index, but I'll just copy the implementation ...
		UserInterface.setButton("findTokensFeatureBtn", (event) => {
			let needle = document.getElementById("findTokensByFeature").value;
			this.selectByContextSearch(needle, this.dataProcessor.contextWordsColumn,
				(needle) => `Sorry, "${needle}" is not present as a feature in this model.`);
		});

		// We have to build the dropdown for the context words manually
		UserInterface.buildDropdown("ctxt",
									this.dataProcessor.tailoredContexts,
									(pair) => { this.contextVar = pair["value"];
												this.plot.updateContextVar(this.contextVar);
												this.buildInterface(); },
									pair => this.contextVar == pair["value"] ?
											`<b>${pair["key"]}</b>` :
											pair["key"],
									d => d.value);

		// We build the model switcher as well
		UserInterface.buildDropdown("models",
									this.modelSelection.models,
									modelName => { window.location.href = 
										router.router.generate("token.type.model.selection", 
																{ type: this.type,
																  model: modelName,
																  selection: this.selection }); },
									modelName => { let truncatedModelName = modelName.replace(`${this.type}.`, "");
												   return ( modelName == this.model ?
												   		   `<b>${truncatedModelName}</b>` :
												   		   truncatedModelName); }
									); // TODO: again, very hard-coded behaviour here...

		this.buildTokenChoice();
		this.buildBrushOrClick();
	}

	buildTokenChoice() {
		UserInterface.buildTokenIdDropdown("tokenIDs", this.dataLoader.datasets["tokens"]);

    	// Add token to token selection on change
    	let tokenChoiceSelect = document.getElementById("tokenChoice");
    	tokenChoiceSelect.onchange = () => {
    		let tokenId = tokenChoiceSelect.value;
    		this.tokenSelection.addIfNotIn(tokenId);
	
    		// Reset dropdown value
    		tokenChoiceSelect.value = "";
    	};
	}

	buildTokenOverview() {
		UserInterface.buildTokenIdCheckboxes(this.tokenSelection.tokens,
											(tokenId) => { this.handleTokenChange(tokenId); });
	}

	buildBrushOrClick() {
		let brushOrClickSwitchers = document.querySelectorAll('input[name="selection"]');

		brushOrClickSwitchers.forEach(brushOrClickSwitcher => {
			brushOrClickSwitcher.onchange = (event) => {
				// todo: brush on the second plot
				let selectedFunction = event.target.value;
				this.brushActive = selectedFunction == "brush";
				this.brushToggle()
				//this.drawPlot();
			} 
		});
	}

	handleTokenChange(tokenId) {
		this.tokenSelection.remove(tokenId);
	}

	get chosenSolution() {
		return this._chosenSolution;
	}

	set chosenSolution(solution) {
		this._chosenSolution = solution;
		this.buildSolutionSwitchDropdown(true);
	}

	mouseClickPoint(row, pointElement) {
		// We manually add a token to the token selection
		// Or, if it's already in the model selection, we remove it
		if (!this.tokenSelection.tokens.includes(row["_id"])) {
			this.tokenSelection.add(row["_id"]);
		} else {
			this.tokenSelection.remove(row["_id"]);
		}

		this.selectFromTokens();

		this.afterTokenRestore();
	}

	mouseClickPointContextWord(row, pointElement) {
		// We manually add a token to the token selection
		// Or, if it's already in the model selection, we remove it
		// TODO MOVE THIS LOGIC TO THE TOKEN SELECTION CLASS !!!
		if (!this.contextWordSelection.tokens.includes(row["_id"])) {
			this.contextWordSelection.add(row["_id"]);
		} else {
			this.contextWordSelection.remove(row["_id"]);
		}

		this.selectFromContextWords();

		this.afterTokenRestore();
	}

	selectFromContextWords() {
		let selectedTokens = this.contextWordSelection.tokens.flatMap(contextWord =>
			this.dataLoader.datasets["tokens"].filter(row => {
				return row[this.dataProcessor.contextWordsColumn].includes(contextWord); })
											  .flatMap(row => row["_id"]));

		this.tokenSelection.restore(selectedTokens);
	}

	selectFromTokens() {
		let selectedTokens = this.dataLoader.datasets["tokens"]
								 .filter(row => this.tokenSelection.tokens.includes(row["_id"]))
								 .flatMap(row => row[this.dataProcessor.contextWordsColumn].split(";"));

		this.contextWordSelection.restore(selectedTokens);

	}

	selectByContextSearch(needle, haystackColumn, generateError) {
		let matchingTokens = this.dataLoader.datasets["tokens"].filter(row => row[haystackColumn].includes(needle));
		console.log(matchingTokens);
		let tokenSelection = matchingTokens.map(row => row["_id"]);

		if (tokenSelection.length > 0) {
			this.tokenSelection.restore(tokenSelection);
			this.updateSelection(this.tokenSelection);	
		}
		else {
			window.alert(generateError(needle));
		}
	}

	selectionByLegend(variable, value) {
		super.selectionByLegend(variable, value);

		// Redraw the plot
		this.afterTokenRestore();
	}

	drawPlot() {
		console.log("I start from the scratch");

		let mouseClickFunction = this.mouseClickPoint.bind(this);
		let brushEndFunction = this.brushEnd.bind(this);
		let selectionByLegendFunction = this.selectionByLegend.bind(this);

		this.plot = new TokenPlot(this.level,
							 	  "svgContainer1",
							 	  this.dimensions,
							 	  this.dataLoader.datasets["nonLostTokens"],
							 	  this.chosenSolution,
							 	  this.contextVar,
							 	  this.dataProcessor.tailoredContexts,
							 	  this.dataPointStyles,
							 	  this.modelSelection,
							 	  this.tokenSelection,
							 	  this.variableSelection,
							 	  mouseClickFunction,
							 	  brushEndFunction,
							 	  selectionByLegendFunction);
		
		let mouseClickFunctionContextWord = this.mouseClickPointContextWord.bind(this);
		let brushEndFunctionContextWord = this.brushEndContextWord.bind(this);

		this.focPlot = new FocDistsPlot(this.level,
										"svgContainer2",
										this.dimensions,
										this.dataLoader.datasets["nonLostFocdists"],
										this.chosenSolution,
										this.contextVar,
										this.dataProcessor.tailoredContexts,
										this.dataPointStyles,
										this.modelSelection,
										this.contextWordSelection,
										this.variableSelection,
										mouseClickFunctionContextWord,
										brushEndFunctionContextWord,
										() => {});

		if (this.dataLoader.datasets["lostTokens"].length == 0) {
			console.log("no token for you");
			return;
		}

		this.lostTokenPlot = new LostTokenPlot(this.level,
											   "losttokens",
											   "tokens",
											   this.dataLoader.datasets["lostTokens"],
											   this.dataProcessor.tailoredContexts,
											   this.dataPointStyles,
											   this.contextWordSelection,
											   this.variableSelection,
											   mouseClickFunction);
	}

	brushToggle() {
		if (this.brushActive)
		{
			let tokenBrush = d3.brush()
						   	   .extent([ [0, 0],
						   		   	[ this.dimensions["width"],
						   		   	  this.dimensions["height"] ] ]);
			this.plot.applyBrush(tokenBrush);

			let focDistsBrush = d3.brush()
						   	      .extent([ [0, 0],
						   		   	  [ this.dimensions["width"],
						   		   	  	this.dimensions["height"] ] ]);
			this.focPlot.applyBrush(focDistsBrush);
		} else {
			d3.selectAll(".brush").remove();
		}
	}

	brushEnd(tokens) {
		this.tokenSelection.restore(tokens);
		this.selectFromTokens();
		this.afterTokenRestore();
	}

	brushEndContextWord(tokens) {
		this.contextWordSelection.restore(tokens);
		this.selectFromContextWords();
		this.afterTokenRestore();
	}

	afterTokenRestore() {
		this.plot.updateSelection(this.tokenSelection);
		this.focPlot.updateSelection(this.contextWordSelection);

		this.buildInterface();
		this.buildTokenOverview();
	}
}