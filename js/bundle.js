'use strict';

//omemo's bundle. parts of which passed into libsig
var bundle = {}

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
  restoreFromDisk: "restore and deserialize function here"
  initialize: "calls libsig's functions to populate the bundle"
}

