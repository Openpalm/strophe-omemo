//mv InMemorySignalProtocolStore.js store.js

function OmemoSignalProtocolPreKeyStore() {
	this.store = {};
}

OmemoSignalProtocolPreKeyStore.prototype = {

	put: function(key, value) {
		if (key === undefined || value === undefined || key === null || value === null)
			throw new Error("Tried to store undefined/null");
		this.store[key] = value;
	},
	get: function(key, defaultValue) {
		if (key === null || key === undefined)
			throw new Error("Tried to get value for undefined/null key");
		if (key in this.store) {
			return this.store[key];
		} else {
			return defaultValue;
		}
	},
	/* Returns a prekeypair object or undefined */
	loadPreKey: function(keyId) {
    var res = this.get('25519KeypreKey' + keyId);
    if (res !== undefined) {
      res = { pubKey: res.pubKey, privKey: res.privKey };
    }
    return Promise.resolve(res);
	},
	storePreKey: function(keyId, keyPair) {
		return Promise.resolve(this.put('25519KeypreKey' + keyId, keyPair));
	},
	removePreKey: function(keyId) {
		return Promise.resolve(this.remove('25519KeypreKey' + keyId));
	},
  extractPreKey: function(keyId) {
		return Promise.resolve(this.remove('25519KeypreKey' + keyId));
  }
};

//module.exports = SignalProtocolStore
