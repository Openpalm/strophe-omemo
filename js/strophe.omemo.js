"use strict";

var $ = require('jquery')
var codec = require('./codec.js')
var gcm = require('./gcm.js')

function pprint(t) {
  console.log("strophe.omemo.js: " + t)
}

var protocol = 'OMEMO'

pprint("initiating")

var omemo = {
  _jid: null,
  _storage: window.localStorage,
  _address: null,
  _sessionBuilder: null,
  _sessions: null,
  _connection: null,
  _store: null,
  _libsignal: null,
  _keyhelper: null,
  _deviceid: null,
  _ns_main: 'eu.siacs.conversations.axolotl',
  _ns_bundles: 'eu.siacs.conversations.axolotl.bundles',
  _ns_devices: 'eu.siacs.conversations.axolotl.devices',
  _ready: false
}

Strophe.addNamespace(protocol, omemo._ns_main);
pprint("namespace successfully loaded")

omemo.init = function(e) {
  omemo._jid = e.jid
  if(omemo._storage.getItem('OMEMO'+omemo._jid) != null) {
    pprint("pre-existing store found. restoring ...")
    omemo._store = omemo.restore(omemo._storage.getItem('OMEMO'+omemo._jid))
    return 
  }
  Promise.all([
    omemo.setStore(e.store),
    omemo.setNewDeviceId(),
    omemo.setLibsignal(e.lib),
    omemo.armLibsignal()
  ])
  //  .then(omemo.setNewDeviceId()) //generates a fresh device id. 
  //  .then(omemo.setLibsignal(e.lib)) // sets libsignal api-library entry point 
  //  .then(omemo.armLibsignal()) //generates the keys and readies the store

  //session per tab
  omemo._storage.setItem(protocol+":"+omemo._jid, true)
  return Promise.resolve(true) 
  //conn.addHandler(this._onMessage.bind(this), null, 'message'); // ? strophe conn?
}
omemo.setNewDeviceId= function () {
  var minDeviceId = 1
  var maxDeviceId = 2147483647
  let diff = (maxDeviceId - minDeviceId)
  let res = Math.floor(Math.random() * diff  + minDeviceId) 
  omemo._deviceid = res
  omemo._store.put('sid', res)
  pprint("generated new device id: " + res)
  return Promise.resolve(true)
}
omemo.setStore = function (store) {
  omemo._store = store 
  return Promise.resolve(true)
}
omemo.setLibsignal = function(ep) {
  if (typeof ep.KeyHelper == "undefined") {
    throw new Error("Illegal input or corrupted libsignal."  + 
     "\nInput parameters are libsignal-protocl.js" +
      "and an appropriate store.\nTerminating.")
  }
  pprint("setting route to libsignal-protocol.js ...")
  omemo._libsignal  = ep
  pprint("setting KeyHelper ... ")
  omemo._keyhelper  = ep.KeyHelper
  pprint("library loaded, KeyHelper set.")
  return Promise.resolve(true)
}
omemo.armLibsignal = function() {
  pprint("first use! arming libsignal with fresh keys... ")
  if (omemo._store == null) {
    throw new Error("no store set, terminating.")
  }
  let KeyHelper = omemo._keyhelper
  Promise.all([
    KeyHelper.generateIdentityKeyPair(),
    KeyHelper.generateRegistrationId(),
  ]).then(function(result) {
    let identity = result[0];
    let registrationId = result[1];
    omemo._store.put('registrationId', result[1])
    pprint("registration id generated and stored.")
    omemo._store.put('identityKey', result[0])
    pprint("identity Key generated and stored.")
    omemo._store.getIdentityKeyPair().then((ikey) => 
      omemo._keyhelper.generateSignedPreKey(ikey, 1)).then((skey) => {
      omemo._store.put('signedPreKey', skey)
      pprint("signed PreKey generated and stored.")
    })
  })
  pprint("generating one time PreKeys")
  omemo.gen100PreKeys(1,100)
  pprint("initiating local libsignal SessionBuilder")
  omemo._address = new libsignal.SignalProtocolAddress(omemo._jid, omemo._deviceid);
  return Promise.resolve(true)
}
omemo.constructOwnXMPPBundle= function (store) { 
  let res = $iq({type: 'set', from: omemo._jid, id: 'anounce2'})
    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
    .c('publish', {node: omemo._ns_bundles + ":" + omemo._deviceid})
    .c('item')
    .c('bundle', {xmlns: omemo._ns_main}) 
    .c('signedPreKeyPublic', {signedPreKeyId: omemo._store.get('signedPreKey').keyId}).
    t(codec.b64encode(omemo._store.get('signedPreKey').keyPair.pubKey)).up()
    .c('signedPreKeySignature')
    .t(codec.b64encode(omemo._store.get('signedPreKey').signature)).up()
    .c('identityKey')
    .t(codec.b64encode(omemo._store.get('identityKey').pubKey)).up()
    .c('prekeys')
  let keys = omemo._store.getPreKeyBundle()
  keys.forEach(function(key) { 
    res = res.c('preKeyPub', {'keyId': key.keyId}).t(codec.b64encode(key.pubKey)).up()
  })
  return res
}
omemo.gen100PreKeys = function (start, finish) { 
  if (start == finish+1)  { 
    pprint("100preKey genereration complete")
    return Promise.resolve(true)
  }
  let index = start  //cant use start. since storePreKey is a promise, and since start++ happens
  //the value of start in relation to k is off by 1 by the time the promise resolves.
  //settins index = start solves this.
  omemo._keyhelper.generatePreKey(index).then((k) => omemo._store.storePreKey(index,k))
  start++

  omemo.gen100PreKeys(start, finish)
}
omemo.refreshPreKeys = function() {
  if (omemo._store == null) {
    throw Exception("no omemo store set, can not refresh.")
  }
  pprint("refreshing one time PreKeys")
  for (var i = 0; i < 100; i++) {
    omemo._keyhelper.generatePreKey(i)
      .then((keyPair) => omemo._store.storePreKey(i, keyPair))
      .then("one time key generation done")
  }
  return Promise.resolve(true)
}
omemo.serialize = function() {
  let res = {}
  res.sid = omemo._deviceid
  res.registrationId = omemo._store.get("registrationId")
  res.signedPreKey = { 
    keyId: omemo._store.get('signedPreKey').keyId,
    keyPair: { 
      pubKey: codec.b64encode(omemo._store.get('signedPreKey').keyPair.pubKey), 
      privKey: codec.b64encode(omemo._store.get('signedPreKey').keyPair.privKey)
    },
    signature:  codec.b64encode(omemo._store.get('signedPreKey').signature)
  }
  res.identityKey =  { 
    pubKey: codec.b64encode(omemo._store.get('identityKey').pubKey), 
    privKey: codec.b64encode(omemo._store.get('identityKey').privKey)
  }
  let keys = omemo._store.getPreKeys()
  keys.forEach(function(key) { 
    res['25519KeypreKey' + key.keyId] =  { 
      pubKey: codec.b64encode(key.keyPair.pubKey), 
      privKey: codec.b64encode(key.keyPair.privKey), 
    }
  })
  res = JSON.stringify(res)
  let me = 'OMEMO' + omemo._jid
  omemo._storage.setItem(me, res)
}
omemo.restore = function (serialized) {
  let res = new SignalProtocolStore()
  serialized = JSON.parse(serialized)
  res.store.sid = serialized.sid
  res.store.registrationId = serialized.registrationId
  res.store.signedPreKey = { 
    keyId: serialized['signedPreKey'].keyId,
    keyPair: { 
      pubKey:   codec.b64encodeToBuffer(serialized.signedPreKey['keyPair'].pubKey), 
      privKey:  codec.b64encodeToBuffer(serialized.signedPreKey['keyPair'].privKey)
    },
    signature: codec.b64encodeToBuffer(serialized.signedPreKey['signature'])
  }
  res.store.identityKey =  { 
    pubKey:   codec.b64encodeToBuffer(serialized.identityKey.pubKey), 
    privKey:  codec.b64encodeToBuffer(serialized.identityKey.privKey)
  }
  let prefix = '25519KeypreKey'
  let key = ''
  for (let keyId = 1; keyId <= 100; keyId++) {
    key = serialized[prefix + keyId]
    console.log(key)
    res.store[prefix + keyId] =  { 
      keyId: keyId, 
      keyPair: {
        pubKey:   codec.b64encodeToBuffer(key.pubKey), 
        privKey:  codec.b64encodeToBuffer(key.privKey)
      }
    }
  }
  return res
}
omemo.createEncryptedStanza = function(to, plaintext) {
  var encryptedStanza = new Strophe.Builder('encrypted', {
    xmlns: Strophe.NS.OMEMO
  });

  return encryptedStanza;
}
omemo._onMessage = function(stanza) {
  $(document).trigger('msgreceived.omemo', [decryptedMessage, stanza]);
}
omemo.OmemoBundleMsgToSTore = function (receivedBundleMsg) {

}
omemo.establish = function (recepientStore) {

}


module.exports = omemo
window.omemo = omemo

pprint("registering with Strophe")
Strophe.addConnectionPlugin('omemo', omemo);
pprint("done")
