class NephoToast extends Toast {
	constructor(icon, headerText, bodyText, timeout=true) {
		super("#toastBar", icon, headerText, bodyText);
	}
}