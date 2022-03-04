class LocalStorageInteractor {
	static getList(key) {
		let localStorageValue = JSON.parse(localStorage.getItem(key));

		if (localStorageValue === null) {
			return []
		}
		else {
			return localStorageValue;
		}
	}
}