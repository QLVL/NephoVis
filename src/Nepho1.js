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

		this.importSelection();

		UserInterface.setButton("clearSelect", () => 
			{
				this.modelSelection.clear();
				UserInterface.resetSelectionButtons();
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

	drawPlot() {
		// If the plot has to redraw, surely some other update has happened
		// So, we update the UI as well
		UserInterface.prepareUI(this.level, this.type, this.modelSelection.count);

		let mouseClickFunction = this.mouseClickPoint.bind(this);
		let selectionByLegendFunction = this.selectionByLegend.bind(this);

		this.preventImport = true;
		window.location.href = router.router.generate("level.type.selection",
													  { level: this.level,
													  	type: this.type,
													  	selection: this.exportSelection() });

		this.plot = new Plot(this.level,
							 "svgContainer",
							 { "width": 600, "height": 600, "padding": 40 },
							 this.dataLoader.datasets["models"],
							 this.dataPointStyles,
							 this.modelSelection,
							 this.variableSelection,
							 mouseClickFunction,
							 selectionByLegendFunction);
		this.plot.initPlot();
	}
}