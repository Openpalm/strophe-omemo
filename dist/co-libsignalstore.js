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

//mv InMemorySignalProtocolStore.js store.js

function SignalProtocolStore() {
  this.store = {}
  this.usedPreKeyCounter = 0
}

SignalProtocolStore.prototype = {
  getIdentityKeyPair: function() {
    return Promise.resolve(this.get('identityKey'));
  },
  getLocalRegistrationId: function() {
    return Promise.resolve(this.get('registrationId'));
  },
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
  loadPreKey: function(keyId) { //the array buffers for the keys are undefined for some reason.
    //might work for libsig internally, but not working externally.
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
  //custom start
  getPreKey: function(keyId) {
    let res = this.get('25519KeypreKey' + keyId);
    if (res !== undefined) {
      return res
    }
    return "undefined"
  },
  getPreKeyPub: function(keyId) {
    let res = this.get('25519KeypreKey' + keyId);
    if (res !== undefined) {
      let pubRecord =  { 
        keyId: res.keyId, 
        pubKey: res.keyPair.pubKey 
      }
      return  pubRecord
    }
    return undefined
  },
  countPreKeysEfficient: function () {
    return   (100 - this.usedPreKeyCounter)
  },
  getPreKeyBundle: function() {
    //track key # here
    let range = 101
    let id = 1 
    let key = undefined
    let keys = []
    while (range) {
      key = omemo._store.getPreKeyPub(id)
      if (key != undefined) {
        keys.push(key)
      }
      id++
      range--
    }
    return keys
  },
  extractAndRemoveRandomPreKey: function() {
    //track key # here
    let range = 100
    let id = 1 
    let key = undefined
    while (key == undefined) {
      id = Math.floor(Math.random() * range) + 1 
      key = omemo._store.getPreKey(id)
      omemo._store.removePreKey(id).then(console.log("PreKey " + id + " extracted/removed"))
    }
    this.usedPreKeyCounter++
    return key
  },
  getOmemoBundle: function() {
    return {
      sid: this.get("sid"),
      identityKey: this.get("identityKey").pubKey,
      signedPreKey: {
        keyId     : this.get("signedPreKey").keyId,
        publicKey : this.get("signedPreKey").keyPair.pubKey,
        signature : this.get("signedPreKey").signature
      },
      preKeys: this.getPreKeyBundle()
    }
  },
  //custom end
  /* Returns a signed keypair object or undefined */
  loadSignedPreKey: function(keyId) {
    var res = this.get('25519KeysignedKey' + keyId);
    if (res !== undefined) {
      res = { pubKey: res.pubKey, privKey: res.privKey };
    }
    return Promise.resolve(res);
  },
  storeSignedPreKey: function(keyId, keyPair) {
    return Promise.resolve(this.put('25519KeysignedKey' + keyId, keyPair));
  },
  removeSignedPreKey: function(keyId) {
    return Promise.resolve(this.remove('25519KeysignedKey' + keyId));
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

//module.exports = SignalProtocolStore


/***/ })
/******/ ]);