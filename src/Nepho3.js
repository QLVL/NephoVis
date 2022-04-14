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

		this.noFocDraw = true;
		this.focPlotActive = true;
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

		if (!this.dataLoader.includesFOC) {
			new NephoToast("info", "FOC plot disabled",
			`<code>${this.type}.focdists.tsv</code> not found. FOC plot will be disabled.`);
		}

		if (this.dataProcessor.tailoredContexts.length <= 1) {
			new NephoToast("info", "Tailored contexts disabled",
			`Fewer than 2 <code>_ctxt</code> columns were defined in <code>${this.type}.variables.tsv</code> for this model.
			 Tailored contexts will be disabled.`);
		}

		if (!(this.contextVar in this.dataLoader.datasets["tokens"][0])) {
			new NephoToast("info", "Context search disabled",
			`No <code>_ctxt</code> column was defined in <code>${this.type}.variables.tsv</code> for this model.
			 Context search will be disabled.`);
			new NephoToast("info", "Concordance viewer disabled",
			`No <code>_ctxt</code> column was defined in <code>${this.type}.variables.tsv</code> for this model.
			 Concordance viewer will be disabled.`);
		}

		if (this.dataProcessor.contextWordsColumn == null) {
			new NephoToast("info", "Frequency table disabled",
			`No <code>_cws</code> column was defined in <code>${this.type}.variables.tsv</code> for this model.
			 Frequency table will be disabled.`);
			new NephoToast("info", "Feature search disabled",
			`No <code>_cws</code> column was defined in <code>${this.type}.variables.tsv</code> for this model.
			 Feature search will be disabled.`);
		}
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

		// TODO: should be hidden when focdists are not available
		UserInterface.setButton("focDistToggle", () => 
			{
				this.toggleFocPlot();
			},
		null,
		!this.dataLoader.includesFOC);

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

		// Disable search if context is not available
		UserInterface.hideElementIfNecessary("findTokensByContextContainer",
											 !(this.contextVar in this.dataLoader.datasets["tokens"][0]));
		UserInterface.hideElementIfNecessary("findTokensByFeatureContainer",
											 this.dataProcessor.contextWordsColumn == null);


		UserInterface.setButton("showTable", (event) => { 
			let params = "width=700,height=700,menubar=no,toolbar=no,location=no,status=no";
			window.open(router.router.generate("frequency.type.contextwordscolumn.selection", 
												{ type: this.type,
												  contextWordsColumn: this.dataProcessor.contextWordsColumn,
												  selection: this.selection }),
						"freqtable",
						params);
		},
		null,
		this.dataProcessor.contextWordsColumn == null);
		// We have to build the dropdown for the context words manually
		UserInterface.buildDropdown("ctxt",
									this.dataProcessor.tailoredContexts,
									(pair) => { this.contextVar = pair["value"];
												this.plot.updateContextVar(this.contextVar);
												this.buildInterface(); },
									pair => this.contextVar == pair["value"] ?
											`<b>${pair["key"]}</b>` :
											pair["key"],
									d => d.value,
									this.dataProcessor.tailoredContexts.length <= 1);

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
		// If there is no context words column to be found, don't do anything
		if (this.dataProcessor.contextWordsColumn == null) {
			return;
		}

		let selectedTokens = this.contextWordSelection.tokens.flatMap(contextWord =>
			this.dataLoader.datasets["tokens"].filter(row => {
				return row[this.dataProcessor.contextWordsColumn].includes(contextWord); })
											  .flatMap(row => row["_id"]));

		selectedTokens = Helpers.unique(selectedTokens);

		this.tokenSelection.restore(selectedTokens);
	}

	selectFromTokens() {
		// Do not select from tokens if no context words are available
		if (!this.dataLoader.includesFOC) {
			return;
		}

		// If there is no context words column to be found, don't do anything
		if (this.dataProcessor.contextWordsColumn == null) {
			return;
		}

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
			new NephoToast("info", "No results found", generateError(needle));
		}
	}

	drawPlot() {
		console.log("I start from the scratch");

		// In case we import from base64 selection
		this.selectFromTokens();

		UserInterface.prepareUI(this.level, this.type);
		UserInterface.setLevel3Headers(this.model, this.chosenSolution);

		let mouseClickFunction = this.mouseClickPoint.bind(this);
		let brushStartFunction = this.brushStart.bind(this);
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
							 	  brushStartFunction,
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

		if (this.doDrawFocPlot) {
			this.drawFocPlot();
		// Hide reserved space for FOC plot
		} else {
			this.focPlotActive = false;
		}
	}

	drawFocPlot() {
		let brushStartFunction = this.brushStart.bind(this);
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
						 	  			brushStartFunction,
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

		this.noFocDraw = false;
	}

	switchSolution() {
		this.plot.destroyBrush();
		this.plot.switchSolution(this.chosenSolution);
		
		if (this.doDrawFocPlot) {
			this.focPlot.destroyBrush();
			this.focPlot.switchSolution(this.chosenSolution);
		}

		super.switchSolution();
	}

	brushToggle() {
		if (this.brushActive)
		{
			this.plot.applyBrush();

			if (this.doDrawFocPlot) {
				this.focPlot.applyBrush();
			}
		} else {
			d3.selectAll(".brush").remove();
		}
	}

	brushStart(plot) {
		// If we're still brushing the same plot, no action is needed
		if (this.currentBrushPlot != plot) {
			// If this is the first brush, no action is needed
			if (this.currentBrushPlot != null) {
				switch (this.currentBrushPlot) {
					case "token":
						this.plot.hideBrush();
						break;
					case "focdists":
						this.focPlot.hideBrush();
						break;
				}
			}

			// Update the currently brushing plot
			this.currentBrushPlot = plot;
		}
	}

	brushEnd(tokens) {
		this.tokenSelection.restore(tokens);

		if (this.doDrawFocPlot) {
			this.selectFromTokens();
		}

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

		if (this.doDrawFocPlot) {
			this.focPlot.updateSelection(this.contextWordSelection);
		}

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

	/* FOC plot switching */
	toggleFocPlot() {
		this.focPlotActive = !this.focPlotActive;
	}

	set focPlotActive(focPlotActive) {
		this._focPlotActive = focPlotActive;

		if (this._focPlotActive) {
			UserInterface.setToggle("focDistToggle",
									'<i class="fas fa-star"></i> FOC plot ON',
									"btn-marigreen");

			// There shouldn't be any drawing onload
			if (!this.noFocDraw) {
				// Then, we do another round of selectFromTokens
				// It is possible that the tokens have changed,
				// which will lead to different foc dists!
				this.selectFromTokens();
				this.afterTokenRestore();
				// ...maybe the solution changed in the meantime?
				this.focPlot.switchSolution(this.chosenSolution);
			}
		} else {
			UserInterface.setToggle("focDistToggle",
									'<i class="far fa-star"></i> FOC plot OFF',
									"btn-danger");
		}

		// Hide FOC plot if necessary
		d3.select("#svgContainer2")
		  .classed("hidden", !this.focPlotActive);

		// Adjust margins on token plot when FOC dist is hidden
		d3.select(".plotArea")
		  .classed("only", !this.focPlotActive);
	}

	get focPlotActive() {
		return this._focPlotActive;
	}

	// Should the FOC plot be drawn?
	get doDrawFocPlot() {
		// If there is no FOC data, it should not be drawn
		if (!this.dataLoader.includesFOC) {
			return false;
		}

		// If there is, return whether FOC plot is active

		return this.focPlotActive;
	}
}