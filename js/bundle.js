'use strict';

//omemo's bundle. parts of which passed into libsig
//imports store and key_helper
var bundle = {}

//dont need this. use the store.
bundle = {
  deviceId: "to be generated on first instantiation, or restored.",
  identityKey: null,
  signedPreKey: { 
    theKey: null, 
    signature: null, 
    keyId: null
  },
  oneTimeKeys: ["one hundred of them, each is a record, generate one with LS and look at it."],
  serialize: "serialization",
  storeToDisk: "store serialized form here",
  restoreFromDisk: "restore and deserialize function here",
  initialize: "calls libsig's functions to populate the bundle"
}

//stack exchange example code


function generateIdentity(store) {
    return Promise.all([
        KeyHelper.generateIdentityKeyPair(),
        KeyHelper.generateRegistrationId(),
    ]).then(function(result) {
        store.put('identityKey', result[0]);
        store.put('registrationId', result[1]);
    });
}

function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    return Promise.all([
        store.getIdentityKeyPair(),
        store.getLocalRegistrationId()
    ]).then(function(result) {
        var identity = result[0];
        var registrationId = result[1];

        return Promise.all([
            KeyHelper.generatePreKey(preKeyId),
            KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
        ]).then(function(keys) {
            var preKey = keys[0]
            var signedPreKey = keys[1];

            store.storePreKey(preKeyId, preKey.keyPair);
            store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

            return {
                identityKey: identity.pubKey,
                registrationId : registrationId,
                preKey:  {
                    keyId     : preKeyId,
                    publicKey : preKey.keyPair.pubKey
                },
                signedPreKey: {
                    keyId     : signedPreKeyId,
                    publicKey : signedPreKey.keyPair.pubKey,
                    signature : signedPreKey.signature
                }
            };
        });
    });
}

module.exports  = bundle
window.bundle = bundle
