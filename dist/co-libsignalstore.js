/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {


function SignalProtocolStore(jid = undefined, rid = undefined) {
	this.prefix = jid + ":" + rid
	this.identifier = jid
	this.store = {}
}

function arrayBufferToArray(buffer) { return Array.apply([], new Uint8Array(buffer)); }

function ArrayToArrayBuffer(array) { return new Uint8Array(array).buffer; }

SignalProtocolStore.prototype = {
	getIdentityKeyPair: function() {
		let res = this.get('identityKey' + this.identifier)
		return Promise.resolve(res);
	},
	getLocalRegistrationId: function() {
		return Promise.resolve(this.get('registrationId'));
	},

	put: function(key, value) {
		if (key === undefined || value === undefined || key === null || value === null)
			throw new Error("Tried to store undefined/null");

		var stringified = JSON.stringify(value, function(key, value) {
			if (value instanceof ArrayBuffer) {
				return arrayBufferToArray(value)
			}

			return value;
		});

		// this.store[key] = value;
		//localStorage.setItem(this.prefix + ':' + key, stringified);
		this.store[this.prefix + ':' + key] =  stringified;
	},
	get: function(key, defaultValue) {

		let nkey = this.prefix + ':' + key
		if (key === null || key === undefined)
			throw new Error("Tried to get value for undefined/null key");
		if (this.prefix + ':' + key in this.store) {
			// return this.store[key];
//			return JSON.parse(localStorage.getItem(this.prefix + ':' + key), function(key, value) {
			return JSON.parse(this.store[nkey], function(key, value) {
				if (/Key$/.test(key)) {
						//console.log("it's a buffer for " + key)
					return ArrayToArrayBuffer(value);
				}

				return value;
			});
		} else {
			console.log(nkey + " not in store")
			return defaultValue;
		}
	},

	remove: function(key) {
		if (key === null || key === undefined)
			throw new Error("Tried to remove value for undefined/null key");
		delete this.store[key];
	},

	isTrustedIdentity: function(identifier, identityKey) {
		if (identifier === null || identifier === undefined) {
			throw new Error("tried to check identity key for undefined/null key");
		}
		if (!(identityKey instanceof ArrayBuffer)) {
			throw new Error("Expected identityKey to be an ArrayBuffer");
		}
		var trusted = this.get('identityKey' + identifier);
		if (trusted === undefined) {
			return Promise.resolve(true);
		}
		return Promise.resolve(util.toString(identityKey) === util.toString(trusted));
	},
	loadIdentityKey: function(identifier) {
		if (identifier === null || identifier === undefined)
			throw new Error("Tried to get identity key for undefined/null key");
		return Promise.resolve(this.get('identityKey' + identifier));
	},
	saveIdentity: function(identifier, identityKey) {
		if (identifier === null || identifier === undefined)
			throw new Error("Tried to put identity key for undefined/null key");
		return Promise.resolve(this.put('identityKey' + identifier, identityKey));
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

	/* Returns a signed keypair object or undefined */
	loadSignedPreKey: function(keyId) {
		var res = this.get('25519KeysignedKey' + keyId);
		if (res !== undefined) {
			res = { pubKey: res.keyPair.pubKey, privKey: res.keyPair.privKey };
		}
		return Promise.resolve(res);
	},
	storeSignedPreKey: function(keyId, keyPair) {
		return Promise.resolve(this.put('25519KeysignedKey' + keyId, keyPair));
	},
	removeSignedPreKey: function(keyId) {
		return Promise.resolve(this.remove('25519KeysignedKey' + keyId));
	},
	//mine
	loadSignedPreKeySignature: function(keyId) {
		var res = this.get('25519KeysignedKey' + keyId).signature;
		if (res !== undefined) {
			res = { res };
		}
		return Promise.resolve(res.res);
	},

	loadSession: function(identifier) {
		return Promise.resolve(this.get('session' + identifier));
	},
	storeSession: function(identifier, record) {
		return Promise.resolve(this.put('session' + identifier, record));
	},
	removeSession: function(identifier) {
		return Promise.resolve(this.remove('session' + identifier));
	},
	removeAllSessions: function(identifier) {
		for (var id in this.store) {
			if (id.startsWith('session' + identifier)) {
				delete this.store[id];
			}
		}
		return Promise.resolve();
	}
};


/***/ })
/******/ ]);