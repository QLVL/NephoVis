class NephoVisLevel1 extends NephoVis {
	constructor(level, type, selection=null) {
		super(level, type, selection);
		this.centralDataset = "models";
		this.dataPointStyleIndex = 0;

		this.dimensions = { "width": 600,
							"height": 600,
							"padding": 40 };
	}

	// This method really deserves a rename, but I'm leaving it in for now for transparency
	execute() { 
		Splash.updateInfo("Setting up interface...");
		this.initVars();

		this.itemSelection = this.modelSelection;

		this.importSelection();

		UserInterface.setButton("go2index", (event) => {
			window.location.href = "./";
		});

		UserInterface.setButton("modelSelect", (event) => {
			if (this.modelSelection.count == 0) {
				new NephoToast("warn", "Cannot open level 2",
					`No models are selected. Please select at least one model and try again.`);
				return;
			}

			let url = router.router.generate("aggregate.type.selection",
											{ type: this.type,
											  selection: this.selection });
			UserInterface.openTab(url);
		});

		UserInterface.setButton("clearSelect", () => 
			{
				this.modelSelection.clear();
				this.resetVariableSelection();
			});

		UserInterface.setButton("medoidsSelect", () =>
			{
				let selectedModels = this.dataLoader.datasets["medoids"].map((row) => row.medoid);

				this.initVariableSelection();
				this.modelSelection.fromMedoids(selectedModels);
				UserInterface.resetSelectionButtons();
			},
			null,
			this.dataLoader.unavailableFiles.includes("medoids") // do not show if medoids are not available
			);

		UserInterface.createButtons("focrow", this.dataProcessor.foc, 
									this.dataLoader.datasets["models"], this.variableSelection, 
									(property, value, checked) => 
										{ this.handleCheckboxChange(property, value, checked); });

		UserInterface.createButtons("socrow", this.dataProcessor.soc,
									this.dataLoader.datasets["models"], this.variableSelection,
									(property, value, checked) => 
										{ this.handleCheckboxChange(property, value, checked); });

		for (let dataPointStyleName in this.dataPointStyles)
		{
			let dataPointStyle = this.dataPointStyles[dataPointStyleName];
			UserInterface.buildDropdown(dataPointStyleName, dataPointStyle.candidates,
										(variable) => 
										{ this.handleDropdownChange(dataPointStyleName, variable); },
										UserInterface.formatVariableName,
										d => d,
										dataPointStyle.candidates.length <= 1);
		}
		
		this.drawPlot();

		this.updateUrl();

		Splash.hide();
	}

	mouseClickPoint(row, pointElement) {
		this.resetVariableSelection();

		// We manually add a model to the model selection
		// Or, if it's already in the model selection, we remove it
		this.modelSelection.toggle(row["_model"]);
	}

	drawPlot() {
		this.drawUi();

		let mouseClickFunction = this.mouseClickPoint.bind(this);
		let selectionByLegendFunction = this.selectionByLegend.bind(this);

		this.plot = new ModelPlot(this.level,
							 "svgContainer",
							 this.dimensions,
							 this.dataLoader.datasets["models"],
							 this.dataPointStyles,
							 this.modelSelection,
							 this.variableSelection,
							 mouseClickFunction,
							 selectionByLegendFunction);
	}

	drawUi() {
		UserInterface.prepareUI(this.level, this.type);
		UserInterface.setModelCount(this.modelSelection.count);
	}

	selectionByLegend(variable, value) {
		super.selectionByLegend(variable, value);

		this.resetVariableSelection();
		this.updateSelection();
	}

	updateSelection() {
		// If the selection has changed, surely some other update has happened
		// So, we update the UI as well
		this.drawUi();
		this.updateUrl();
		this.plot.updateSelection(this.modelSelection);
	}

	resetVariableSelection() {
		this.initVariableSelection();
		UserInterface.resetSelectionButtons();
	}

	updateUrl() {
		super.updateUrl();
		window.location.href = router.router.generate("model.type.selection",
													  { type: this.type,
													  	selection: this.selection });
	}
}