class Splash {
	static hide() {
		d3.select("#splash").remove();
	}

	static updateInfo(message) {
		d3.select("#splashInfo").html(message);
	}
}