  //mv InMemorySignalProtocolStore.js store.js

function SignalProtocolStore() {
  this.store = {}
  this.lastUsedPreKeyId = 0
  this.usedPreKeyCounter = 0
  this.currentSignedPreKeyId = 0
  this.identifier = ''
}

  SignalProtocolStore.prototype = {
    getIdentityKeyPair: function() {
      return Promise.resolve(this.get('identityKey' + this.identifier));
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
        //identifier is the jid, internally called from libsignaladdress.getName()
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
        let out
        if (res !== undefined) {
          out = { pubKey: res.keyPair.pubKey, privKey: res.keyPair.privKey };
        }
        return Promise.resolve(out);
      },
      storePreKey: function(keyId, keyPair) {
        return Promise.resolve(this.put('25519KeypreKey' + keyId, keyPair));
      },
      removePreKey: function(keyId) {
        return Promise.resolve(this.remove('25519KeypreKey' + keyId));
      },
      //custom start
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
            pubKey: res.keyPair.pubKey
          }
          return  pubRecord
        }
        return undefined
      },
      countPreKeysEfficient: function (context) {
        return   (100 - context._store.usedPreKeyCounter)
      },
      getPreKeyBundle: function(context) {
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
      getPreKeys: function(context) {
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
      getOmemoBundle: function(context) {
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
      getPublicBundle: function(context) {
        let sk = context._store.get('25519KeysignedKey' + context._store.currentSignedPreKeyId)
        let preKey =  context._store.selectRandomPreKey(context)
        return context._store.loadIdentityKey(context._jid).then(res => {
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
  /* Returns a signed keypair object or undefined */
  loadSignedPreKey: function(keyId) {
    var res = this.get('25519KeysignedKey' + keyId);
    if (res !== undefined) {
      res = { pubKey: res.keyPair.pubKey, privKey: res.keyPair.privKey };
    }
    return Promise.resolve(res);
  },
  loadSignedPreKeySignature: function(keyId) {
    var res = this.get('25519KeysignedKey' + keyId).signature;
    if (res !== undefined) {
      res = { res };
    }
    return Promise.resolve(res.res);
  },
  storeSignedPreKey: function(keyId, keyPair) {
    this.currentSignedPreKeyId = keyId
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
