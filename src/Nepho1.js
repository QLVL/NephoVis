class NephoVisLevel1 extends NephoVis {
	constructor(level, type, selection=null) {
		super(level, type, selection);
		this.centralDataset = "models";
	}

	// This method really deserves a rename, but I'm leaving it in for now for transparency
	execute() { 
		// TODO: should this be responsive?
		this.canvasWidth = 600;
		this.canvasHeight = 600;
		this.canvasPadding = 40;

		this.initVars();

		this.itemSelection = this.modelSelection;

		this.importSelection();

		UserInterface.setButton("go2index", (event) => {
			window.location.href = "./";
		});

		UserInterface.setButton("modelSelect", (event) => {
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
			});

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
										UserInterface.formatVariableName);
		}
		
		this.drawPlot();
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
							 { "width": 600, "height": 600, "padding": 40 },
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
		window.location.href = router.router.generate("level.type.selection",
													  { level: this.level,
													  	type: this.type,
													  	selection: this.selection });
	}
}