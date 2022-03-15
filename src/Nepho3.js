class NephoVisLevel3 extends NephoVis {
	constructor(level, type, model, selection=null) {
		super(level, type, selection);
	}

	execute() {
		// Set the current dimension reduction solution to simply be the first one
		this.chosenSolution = this.dataLoader.alternatives[0];

		this.offerAlternatives();
	}

	offerAlternatives() {
		// TODO: how can tokens be in the datasets if we always remove it if it's there?
		if (!("tokens" in this.dataLoader.datasets) && this.dataLoader.alternatives != null) {
			UserInterface.buildSolutionSwitchDropdown("moveAround", this.dataLoader.alternatives);
		}
	}
}