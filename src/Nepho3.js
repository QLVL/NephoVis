class NephoVisLevel3 extends NephoVisLevel23Common {
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
		super.execute();

		// Initialise all variables
		this.initVars();

		this.importSelection();

		// Build the switcher which allows you to switch between dimension reduction solutions
		this.buildSolutionSwitchDropdown();

		this.itemSelection = this.tokenSelection;

		// The context variable dictates what context column should be consulted on hover
		this.contextVar = "_ctxt.raw";

		this.buildInterface();

		this.drawPlot();
	}

	initVars() {
		super.initVars();

		let tokenSelectionUpdateCallback = () => { this.selectFromTokens(); 
												   this.afterTokenRestore(); };
		let contextWordSelectionUpdateCallback = () => { this.selectFromContextWords();
														 this.afterTokenRestore(); };

		this.tokenSelection = new TokenSelection(tokenSelectionUpdateCallback);
		this.contextWordSelection = new TokenSelection(contextWordSelectionUpdateCallback);
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

		UserInterface.setButton("showTable", (event) => { 
			let params = "width=700,height=700,menubar=no,toolbar=no,location=no,status=no";
			window.open(router.router.generate("frequency.type.contextwordscolumn.selection", 
												{ type: this.type,
												  contextWordsColumn: this.dataProcessor.contextWordsColumn,
												  selection: this.selection }),
						"freqtable",
						params);
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
				let selectedFunction = event.target.value;
				this.brushActive = selectedFunction == "brush";
			} 
		});
	}

	handleTokenChange(tokenId) {
		this.tokenSelection.remove(tokenId);
	}

	handleDropdownChange(dataPointStyleName, variable) {
		// Do regular dropdown change, but also update lost token plots if they're available
		super.handleDropdownChange(dataPointStyleName, variable);

		if (this.lostTokenPlot != null) {
			this.lostTokenPlot.restyle(this.dataPointStyles);
		}
	}

	get chosenSolution() {
		return this._chosenSolution;
	}

	set chosenSolution(solution) {
		this._chosenSolution = solution;
		this.buildSolutionSwitchDropdown(true);
		this.switchSolution();
		this.updateUrl();
	}

	restoreChosenSolution(chosenSolution) {
		this._chosenSolution = chosenSolution;
	}

	mouseClickPoint(row, pointElement) {
		// We manually add a token to the token selection
		// Or, if it's already in the model selection, we remove it
		this.tokenSelection.toggle(row["_id"]);
	}

	mouseClickPointContextWord(row, pointElement) {
		// We manually add a token to the token selection
		// Or, if it's already in the model selection, we remove it
		this.contextWordSelection.toggle(row["_id"]);
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
		let matchingTokens = this.dataLoader.datasets["tokens"].filter(row => row[haystackColumn].search(needle) !== -1);
		console.log(matchingTokens);
		let tokenSelection = matchingTokens.map(row => row["_id"]);

		if (tokenSelection.length > 0) {
			this.tokenSelection.restore(tokenSelection);
			this.afterTokenRestore();
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

		// In case we import from base64 selection
		this.selectFromTokens();

		UserInterface.prepareUI(this.level, this.type);
		UserInterface.setLevel3Headers(this.model, this.chosenSolution);

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
	
		// Set null value so we can check for lost token plot even if it's not there
		this.lostTokenPlot = null;

		if (this.dataLoader.datasets["lostTokens"].length > 0) {
			this.lostTokenPlot = new LostTokenPlot(this.level,
												   "losttokens",
												   "tokens",
												   this.dataLoader.datasets["lostTokens"],
							 	  				   this.contextVar,
												   this.dataProcessor.tailoredContexts,
												   this.dataPointStyles,
												   this.tokenSelection,
												   this.variableSelection,
												   mouseClickFunction);
		}

		if (this.dataLoader.includesFOC) {
			let mouseClickFunctionContextWord = this.mouseClickPointContextWord.bind(this);
			let brushEndFunctionContextWord = this.brushEndContextWord.bind(this);

			this.focPlot = new FocDistsPlot(this.level,
											"svgContainer2",
											this.dimensions,
											this.dataLoader.datasets["nonLostFocdists"],
											this.dataLoader.datasets["nonLostTokens"],
											this.chosenSolution,
											this.contextVar,
											this.dataProcessor.contextWordsColumn,
											this.dataProcessor.tailoredContexts,
											this.dataPointStyles,
											this.modelSelection,
											this.contextWordSelection,
											this.variableSelection,
											mouseClickFunctionContextWord,
											brushEndFunctionContextWord,
											() => {});

			if (this.dataLoader.datasets["lostFocdists"].length > 0) {
				this.lostFocdistsPlot = new LostFocDistsPlot(this.level,
										   					 "lostfocdists",
										   					 "FOCs",
										   					 this.dataLoader.datasets["lostFocdists"],
										   					 this.dataLoader.datasets["nonLostTokens"],
					 	  									 this.dataProcessor.contextWordsColumn,
										   					 this.dataProcessor.tailoredContexts,
										   					 this.dataPointStyles,
										   					 this.contextWordSelection,
										   					 this.variableSelection,
										   					 mouseClickFunctionContextWord);
			}
		}
	}

	switchSolution() {
		this.brushActive = false;

		this.plot.switchSolution(this.chosenSolution);
		
		if (this.dataLoader.includesFOC) {
			this.focPlot.switchSolution(this.chosenSolution);
		}
	}

	get brushActive() {
		return this._brushActive;
	}

	set brushActive(brushActive) {
		this._brushActive = brushActive;
		this.brushToggle();
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
		this.updateUrl();
		this.plot.updateSelection(this.tokenSelection);
		this.focPlot.updateSelection(this.contextWordSelection);

		this.buildInterface();
		this.buildTokenOverview();
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

	updateUrl() {
		super.updateUrl();
		this.selection = this.exportSelection();
		window.location.href = router.router.generate("token.type.model.selection",
													  { model: this.model,
													  	type: this.type,
													  	selection: this.selection });
	}
}