class Toast {
	constructor(parentElement, icon, headerText, bodyText, timeout=true) {
		let baseTimeout = 15000;

		this.parentElement = d3.select(parentElement);

		this.toastElement = this.parentElement.append("div")
											  .attr("class", "toast");

		let toastHeader = this.toastElement.append("div")
									   .attr("class", "toast-header");

		switch (icon) {
			case "info":
				icon = "fa-info-circle";
				break;
			case "question":
				icon = "fa-question-circle";
				break;
			case "check":
				icon = "fa-check-circle";
				break;
			case "warn":
				icon = "fa-exclamation-circle";
				break;
			// Icon will be used as-is (custom icon classes possible)
			default:
				break;

		}

		toastHeader.append("div")
				   .attr("class", "bd-placeholder-img rounded mr-2")
				   .style("height", "20px")
				   .style("width", "20px")
				   .html(`<i class="fas ${icon}"></i>`);

		toastHeader.append("strong")
				   .style("margin-right", "auto")
				   .html(headerText);

		toastHeader.append("button")
				   .attr("type", "button")
				   .attr("class", "ml-2 mb-1 close")
				   .attr("aria-label", "Close")
				   .append("span")
				   .attr("aria-hidden", "true")
				   .on("click", () => { this.destroy() })
				   .html("&times;");

		let toastBody = this.toastElement.append("div")
									 .attr("class", "toast-body")
									 .html(bodyText);

		this.toastElement.style("opacity", 1);

		// If there are multiple toasts to read, we multiply the timeout by that number of toasts + 1
		// We also add some decay, else it takes too long
		// This way there is enough time to read all toasts
		let toastCount = this.parentElement.selectAll(".toast")
										  .size();

		setTimeout(() => { this.destroy(); }, (toastCount * 0.3 + 1) * baseTimeout );
	}

	destroy() {
		this.toastElement.remove();
	}
}