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

		this.buildSolutionSwitchDropdown();

		this.itemSelection = this.tokenSelection;

		this.buildInterface();

		this.drawPlot();

		this.updateUrl();
	}

	initVars() {
		super.initVars();

		let tokenSelectionUpdateCallback = () => { this.selectFromTokens(); 
												   this.afterTokenRestore(); };

		this.tokenSelection = new TokenSelection(tokenSelectionUpdateCallback);

		let contextWordSelectionUpdateCallback = () => { this.selectFromContextWords();
														 this.afterTokenRestore(); };
		this.contextWordSelection = new TokenSelection(contextWordSelectionUpdateCallback);
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
		this.dataProcessor.contextWordsColumn = 
			Helpers.findContextWordsColumn(this.dataProcessor.columnNames,
								   		   this.model);
	}

	buildInterface() {
		super.buildInterface();

		UserInterface.setButton("clearSelect", () => 
			{
				this.tokenSelection.clear();
				this.contextWordSelection.clear();
			});

		UserInterface.setButton("toLevel2", () => 
			{
				console.log("halelqse");
				window.location.href = router.router.generate("aggregate.type.selection",
													  { type: this.type,
													  	selection: this.selection });
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

		selectedTokens = Helpers.unique(selectedTokens);

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
		super.switchSolution();

		this.plot.switchSolution(this.chosenSolution);
		
		if (this.dataLoader.includesFOC) {
			this.focPlot.switchSolution(this.chosenSolution);
		}
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

	updateUrl() {
		super.updateUrl();
		window.location.href = router.router.generate("token.type.model.selection",
													  { model: this.model,
													  	type: this.type,
													  	selection: this.selection });
	}
}