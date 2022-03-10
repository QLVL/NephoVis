class NephoSession {
	constructor() {
		this.nephoVis = null;
	}

	buildNephoVis(level, type, selection) {
		// If there is an existing NephoVis interface, we maybe can reuse it
		if (this.nephoVis != null) {
			// If the type and level haven't changed, update the selection
			if (this.nephoVis.type == type && this.nephoVis.level == level) {
				this.nephoVis.importSelection(selection);
				return;
			}
			else {
				window.location.reload();
			}
		}

		// In all other cases, build a new nephovis
		this.nephoVis = new NephoVis(level, type, selection);
	}
}

nephoSession = new NephoSession();