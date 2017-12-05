
function SignalProtocolStore(jid = undefined, rid = undefined) {
	this.prefix = jid + "." + rid
	this.identifier =  this.prefix
	this.rid = rid
	this.jid = jid
	this.store = {}
	this.currentSignedPreKeyId = 1
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
		console.log(res)
		if (res !== undefined) {
			res = { pubKey: res.keyPair.pubKey, privKey: res.keyPair.privKey };
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
	},

	//old code start

		getPreKey: function(keyId, context = this) {
        let res = context._store.get('25519KeypreKey' + keyId);
        if (res !== undefined) {
          return res
        }
        return undefined
      },
      getPreKeyPub: function(keyId, context = this) {
        let res = context._store.get('25519KeypreKey' + keyId);
        if (res !== undefined) {
          let pubRecord =  {
            keyId: res.keyId,
            pubKey: res.keyPair.pubKey
          }
          return  pubRecord
        }
        return undefined
      },
      countPreKeysEfficient: function (context = this) {
        return   (100 - context._store.usedPreKeyCounter)
      },
      getPreKeyBundle: function(context = this) {
        let range = 101
        let id = 1
        let key = undefined
        let keys = []
        while (range) {
          key = context._store.getPreKeyPub(id, context)
          if (key != undefined) {
            keys.push(key)
          }
          id++
          range--
        }
        return keys
      },
      getPreKeys: function(context = this) {
        //track key # here
        let range = 101
        let id = 1
        let key = undefined
        let keys = []
        while (range) {
          key = context._store.getPreKey(id, context)
          if (key != undefined) {
            keys.push(key)
          }
          id++
          range--
        }
        return keys
      },
      selectRandomPreKey: function(context = this) {
        //track key # here
        let range = 100
        let id = 1
        let key = undefined
        while (key == undefined) {
          id = Math.floor(Math.random() * range) + 1
					console.log(id)
          key = context._store.getPreKey(id, context)
          //omemo._store.removePreKey(id).then(console.log("PreKey " + id + " extracted/removed"))
        }
        context._store.usedPreKeyCounter++
        return key
      },
      getOmemoBundle: function(context = this) {
        return {
          registrationId: context._store.get("registrationId"),
          identityKey: context._store.get("identityKey").pubKey,
          signedPreKey: {
            keyId     : context._store.get("signedPreKey").keyId,
            publicKey : context._store.get("signedPreKey").keyPair.pubKey,
            signature : context._store.get("sigedPreKey").signature
          },
          preKeys: context._store.getPreKeyBundle()
        }
      },
      getPublicBundle: function(context = this) {
        let sk = context._store.get('25519KeysignedKey' + context._store.currentSignedPreKeyId)
        let preKey =  context._store.selectRandomPreKey(context)
        return context._store.getIdentityKeyPair().then(res => {
          return {
            registrationId: context._store.get("registrationId"),
            identityKey: res.pubKey,
            signedPreKey: {
              keyId     : sk.keyId,
              publicKey : sk.keyPair.pubKey,
              signature : sk.signature
            },
            preKey: {
              keyId     : preKey.keyId,
              publicKey : preKey.keyPair.pubKey
            }
          }
        })
      },

  //custom end

};
