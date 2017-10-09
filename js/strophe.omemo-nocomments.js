"use strict";

var $ = require('jquery'); //not used yet. candidate for deletion.
var codec = require('./codec.js')
var gcm = require('./gcm.js')

function pprint(t) {
  console.log("strophe.omemo.js: " + t)
}

let ns = {}
var protocol = 'OMEMO'

pprint("initiating")

var omemo = {
  _jid: null,
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

var iq = $iq({type: 'set', from:'eddie@mcjiddy.jid', id: 'anounce2' })
  .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
  .c('publish', {node: omemo._ns_main })

pprint(iq) // yep it works.

omemo.init = function(libsignal, store, jid, conn) {
  omemo._jid = jid 
  omemo.setStore(store)
    .then(omemo.setNewDeviceId()) //generates a fresh device id. 
    .then(omemo.setLibsignal(libsignal)) // sets libsignal api-library entry point 
    .then(omemo.armLibsignal()) //generates the keys and readies the store

  return Promise.resolve(true) //comfort for .then()
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
    throw new Error("Illegal input or corrupted libsignal. \nInput parameters are libsignal-protocl.js and an appropriate store.\nTerminating.")
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
    omemo._store.getIdentityKeyPair().then((ikey) => omemo._keyhelper.generateSignedPreKey(ikey, 1)).then((skey) => {
      omemo._store.put('signedPreKey', skey)
      pprint("signed PreKey generated and stored.")
    })
  })
  pprint("generating one time PreKeys")
  omemo.gen100PreKeys(0,100)
  pprint("initiating local libsignal SessionBuilder")
  omemo._address = new libsignal.SignalProtocolAddress(omemo._jid, omemo._deviceid);
  return Promise.resolve(true)
}
omemo.establish = function (recepientStore) {
}
omemo.constructOwnXMPPBundle= function (store) { 
  //to be published
  let res = $iq({type: 'set', from: omemo._jid, id: 'anounce2' })
    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
    .c('publish', {node: omemo._ns_bundles + ":" + omemo._store.get("sid")})
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
}

omemo.deconstructReceivedXMPPBundle = function (receivedBundleMsg) {

}
omemo.gen100PreKeys = function (start, finish) { 
  if (start == finish+1)  { 
    pprint("100preKey genereration complete")
    return Promise.resolve(true)
  }
  omemo._keyhelper.generatePreKey(start).then((k) => omemo._store.storePreKey(start,k))
  start++
  omemo.gen100PreKeys(start, finish)
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
omemo.refreshPreKeys = function() {
  pprint("refreshing one time PreKeys")
  for (var i = 0; i < 100; i++) {
    omemo._keyhelper.generatePreKey(i)
      .then((keyPair) => omemo._store.storePreKey(i, keyPair))
      .then("one time key generation done")
  }
  return Promise.resolve(true)
}
omemo.restore = function(file) {
  return Promise.resolve(true)
}
omemo.serialize = function(file) {
  let serialized = JSON.stringify(omemo._store)
  return Promise.resolve(true)
}

omemo.setUpMessageElements = function(type, text) {
}

module.exports = omemo
window.omemo = omemo

pprint("registering with Strophe")
Strophe.addConnectionPlugin('omemo', omemo);
pprint("done")
