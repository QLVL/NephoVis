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

	static getValue(key) {
		return localStorage.getItem(key);
	}

	static setValue(key, value) {
		return localStorage.setItem(key, value);
	}
}