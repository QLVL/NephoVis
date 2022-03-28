class Tooltip {
	constructor(targetElement, offset) {
		this.targetElement = targetElement;
		this.offset = offset;

		this.createElement();
	}

	createElement() {
		this.tooltip = this.targetElement.append("div")
										 .attr("class", "tooltip");
	}

	show(content, top, left, containerWidth) {
		// Transition is disabled because it leads to issues with the computed width of the tooltip
		this.tooltip//.transition()
					//.duration(200)
					.style("opacity", 1)
					.style("display", "block");

		// Create the tooltip first (we need its width to position it)
		this.tooltip.html(content)
					.style("top", (top + this.offset) + "px");

		let tooltipWidth = parseInt(this.tooltip.style("width"));
		let tooltipLeftCoordinate = containerWidth - left > tooltipWidth ?
									`${left}px` :
									`${Math.max(0, (left - tooltipWidth))}px`;

		// Adjust the left coordinate
		this.tooltip.style("left", tooltipLeftCoordinate);
	}

	hide() {
		// Do the fade-out effect
		//this.tooltip.transition().duration(this.tooltipTimeoutDuration).style("opacity", 0);
		// Completely set display to "none" after the set timeout
		//this.tooltipHideTimeout = setTimeout(
		//	() => { this.tooltip.style("display", "none"); }, this.tooltipTimeoutDuration);

		this.tooltip.style("display", "none");
	}
}