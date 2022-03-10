class NephoVis {
	constructor(level, type) {
		this.level = level;
		this.type = type;
		this.requestedFiles = RequestedFilesMapper[level];

		// Define the data loader and load the CSV files for this type
		this.dataLoader = new DataLoader(this.type, this.requestedFiles);
		this.dataLoader.loadData().then(() => { this.execute(); });
	}

	// This method really deserves a rename, but I'm leaving it in for now for transparency
	execute() {
		// TODO: should this be responsive?
		this.canvasWidth = 600;
		this.canvasHeight = 600;
		this.canvasPadding = 40;

		this.initVars();


		UserInterface.setButton("clearSelect", () => 
			{
				// todo: update model selection (probably should be done automatically)
				this.modelSelection.clear();

				// Reset selection buttons
				d3.selectAll("label[name='selectionByButtons']").classed("active", false);
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
			UserInterface.buildDropdown(dataPointStyleName, dataPointStyle.candidates, "model", 
										(variable) => 
										{ this.handleDropdownChange(dataPointStyleName, variable); });
		}
		
		this.drawPlot();
	}

	initVars() {
		this.dataProcessor = new DataProcessor(this.dataLoader.datasets);
		// TODO: color var, shapevar, sizevar

		// TODO: re-introduce LocalStorage if deemed necessary
		//this.modelSelection = []
		this.modelSelection = new ModelSelection(this.dataLoader.datasets["models"],
												 () => { this.drawPlot(); });

		this.variableSelection = {};
		for (var i = 0; i < this.dataProcessor.nominalNames.length; i++) {
			let nominal = this.dataProcessor.nominalNames[i];
			this.variableSelection[nominal] = [];
		}

		let dataOptionsTable = { "colour": this.dataProcessor.nominalNames,
							 	 "shape": this.dataProcessor.nominalNames,
							 	 "size": this.dataProcessor.numeralNames };

		this.dataPointStyles = {};
		for (var i = 0; i < Constants.dataPointStyles.length; i++)
		{
			// todo: embed this in "Constants" somehow
			let dataPointStyleName = Constants.dataPointStyles[i];
			this.dataPointStyles[dataPointStyleName] = new DataPointStyle(dataPointStyleName,
													    dataOptionsTable[dataPointStyleName]);
		}
	}

	drawPlot() {
		// If the plot has to redraw, surely some other update has happened
		// So, we update the UI as well
		UserInterface.prepareUI(this.level, this.type, this.modelSelection.count);

		this.plot = new Plot("svgContainer",
							 { "width": 600, "height": 600, "padding": 40 },
							 this.dataLoader.datasets["models"],
							 this.dataPointStyles,
							 this.modelSelection);
	}

	handleCheckboxChange(property, value, checked) {

		if (checked)
		{
			this.variableSelection[property].push(value);
		} else {
			let toDeleteIndex = this.variableSelection[property].indexOf(value);
			this.variableSelection[property].splice(toDeleteIndex, 1); 
		}

		this.modelSelection.select(this.variableSelection);

		// todo: re-implement local storage if deemed necessary
	}

	handleDropdownChange(dataPointStyleName, variable) {
		// todo: re-implement local storage if deemed necessary

		this.dataPointStyles[dataPointStyleName].assign(variable,
												 Helpers.getValues(this.dataLoader.datasets["models"],
																   variable));

		// TODO: I don't really understand how the data structure works

		this.drawPlot();

		// TODO updatePlot
		// TODO updateLegend
	}
}