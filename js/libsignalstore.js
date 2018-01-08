  function SignalProtocolStore() {
  this.store = {};
}

SignalProtocolStore.prototype = {
  Direction: {
    SENDING: 1,
    RECEIVING: 2,
  },

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

  isTrustedIdentity: function(identifier, identityKey, direction) {
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

    var address = new libsignal.SignalProtocolAddress.fromString(identifier);

    var existing = this.get('identityKey' + address.getName());
    this.put('identityKey' + address.getName(), identityKey)

    if (existing && util.toString(identityKey) !== util.toString(existing)) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
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
  },
    //mycode
     
    loadSignedPreKeySignature: function(keyId) {
    var res = this.get('25519KeysignedKey' + keyId);
    if (res !== undefined) {
        return Promise.resolve(res.signature)
    }
    return Promise.reject("failed to fetch signature");
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


    getPublicBundle: function(context, keyId = 1) {
        let promises = []
        let signedKeyId = 1

        promises.push(context._store.loadSignedPreKey(signedKeyId))
        promises.push(context._store.loadSignedPreKeySignature(signedKeyId))
        promises.push(context._store.getIdentityKeyPair())
        promises.push(context._store.loadPreKey(keyId))

        return Promise.all(promises).then(function (res) {
            let sk = res[0]
            let signature = res[1]
            let ik = res[2]
            let preKey =  res[3]
            return {
                registrationId: context._store.get("registrationId"),
                identityKey: ik.pubKey,
                signedPreKey: {
                    keyId     : signedKeyId,
                    publicKey : sk.pubKey,
                    signature : signature
                },
                preKey: {
                    keyId     : keyId,
                    publicKey : preKey.pubKey
                }
            }
        })
    },


    selectRandomPreKey: function(context) {
        //track key # here
        let range = 100
        let id = 1
        let key = undefined
        while (key == undefined) {
            id = Math.floor(Math.random() * range) + 1
            key = context._store.getPreKey(id, context)
            //omemo._store.removePreKey(id).then(console.log("PreKey " + id + " extracted/removed"))
        }
        context._store.usedPreKeyCounter++
        return key
    },


    getPreKey: function(keyId, context) {
        let res = context._store.get('25519KeypreKey' + keyId);
        if (res !== undefined) {
            return res
        }
        return undefined
    },
    getPreKeyPub: function(keyId, context) {
        let res = context._store.get('25519KeypreKey' + keyId);
        if (res !== undefined) {
            let pubRecord =  {
                keyId: res.keyId,
                pubKey: res.pubKey
            }
            return  pubRecord
        }
        return undefined
    },








};
