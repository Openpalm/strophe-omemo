/*jslint browser: true, regexp: true */
  /*global jQuery, $ */

  /* vim: set ft=javascript: */
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
  _gcm: gcm,
  _codec: codec,
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
pprint("namespace loaded")

omemo.init = function(e) {
  omemo._jid = e.jid
  if (omemo._storage.getItem('OMEMO'+omemo._jid) != null) {
    pprint("pre-existing store found. restoring ...")
    omemo._store = omemo.restore(omemo._storage.getItem('OMEMO'+omemo._jid))
    omemo._libsignal = e.libsignal
    omemo._address = new omemo._libsignal.SignalProtocolAddress(omemo._jid, omemo._store.get("registrationId"))
    return
  }
    omemo.setStore(e.store)
    //omemo.setNewDeviceId()
    omemo.setLibsignal(e.libsignal) // can probably be replaced with a direct assignment
    omemo.armLibsignal()
    omemo.gen100PreKeys(1,100)
    omemo._ready = true

  //session per tab
  //conn.addHandler(this._onMessage.bind(this), null, 'message'); // ? strophe conn?
}
//omemo.setNewDeviceId= function () {
//  var minDeviceId = 1
//  var maxDeviceId = 2147483647
//  let diff = (maxDeviceId - minDeviceId)
//  let res = Math.floor(Math.random() * diff  + minDeviceId) 
//  omemo._deviceid = res
//  omemo._store.put('sid', res)
//  pprint("generated new device id: " + res)
//}
omemo.setStore = function (store) {
  omemo._store = store 
}
//give reg id here as option, if not null, use, if null, gen new.
omemo.setLibsignal = function(ep) {
  if (typeof ep.KeyHelper == "undefined") {
    throw new Error("Illegal input or corrupted libsignal."  + 
     "\nInput parameters are libsignal-protocl.js" +
      "and an appropriate store.\nTerminating.")
  }
  pprint("setting route to libsignal-protocol.js ...")
  omemo._libsignal = ep
  pprint("setting KeyHelper ... ")
  omemo._keyhelper = ep.KeyHelper
  pprint("library loaded, KeyHelper set.")
}
omemo.armLibsignal = function(jid, id) {
  pprint("first use! arming libsignal with fresh keys... ")
  if (omemo._store == null) {
    throw new Error("no store set, terminating.")
  }
  let KeyHelper = omemo._keyhelper
  let registrationId = ''
  Promise.all([
    KeyHelper.generateIdentityKeyPair(),
    KeyHelper.generateRegistrationId(), //supply manually.
  ]).then(function(result) {
    let identity = result[0];
    if (id == null) {
      pprint('device id not supplied, using a randomly generated id')
      registrationId = result[1]
    } else {
      registrationId = id
    }
    omemo._store.put('registrationId', registrationId)
    pprint("registration id generated and stored.")
    omemo._store.put('identityKey', result[0])
    pprint("identity Key generated and stored.")
    omemo._store.getIdentityKeyPair().then((ikey) => 
      omemo._keyhelper.generateSignedPreKey(ikey, 1)).then((skey) => {
      omemo._store.put('signedPreKey', skey)
      pprint("signed PreKey generated and stored.")
    })
  omemo._address = new libsignal.SignalProtocolAddress(omemo._jid, omemo._store.get('registrationId'));
  pprint("libsignal armed for " + omemo._jid + '.' + omemo._store.get('registrationId'))
  })
}
omemo.constructOwnXMPPBundle= function (store) { 
  let res = $iq({type: 'set', from: omemo._jid, id: 'anounce2'})
    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
    .c('publish', {node: omemo._ns_bundles + ":" + omemo._store.get('registrationId')})
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
    return
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
}
omemo.serialize = function() {
  let res = {}
  res.jid = omemo._jid
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
  res.store.jid = serialized.jid
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
    res.store[prefix + keyId] =  { 
      keyId: keyId, 
      keyPair: {
        pubKey:   codec.b64encodeToBuffer(key.pubKey), 
        privKey:  codec.b64encodeToBuffer(key.privKey)
      }
    }
  }
  pprint("libsignal store for " + res.store.jid + " recreated")
  return res
}
omemo.createEncryptedStanza = function(to, plaintext) {
  var encryptedStanza = new Strophe.Builder('encrypted', {
    xmlns: Strophe.NS.OMEMO
  });

  return encryptedStanza;
}
omemo.buildSession = function (theirStore, theirJid) {
  let target = theirStore.get('jid') + '.' + theirStore.get('registrationId')
  pprint('building session with ' + target)
  let myAddress =  omemo._address
  pprint('our own libsignal address record: ') 
  console.log(myAddress)
  pprint('importing our own store')
  let myStore = omemo._store
  console.log(myStore)
  let theirAddress = new omemo._libsignal.SignalProtocolAddress(theirStore.store.jid, theirStore.store.registrationId)
  pprint('creating a libsignal address recrod from their Store:')
  console.log(theirAddress)
  pprint('extracting a preKey record from their store ')
  let theirSessionBundle =  theirStore.getSessionBuilderBundle() //should be a /public/ keystore from a received bundle
  console.log(theirSessionBundle)
  let myBuilder = new omemo._libsignal.SessionBuilder(omemo._store, theirAddress)
  pprint('building session, processing PreKey record:')
  let cipher = ''
  let session = myBuilder.processPreKey(theirSessionBundle)
  session.then( function onsuccess(){
    pprint('session successfully established')
  })
  session.catch( function onerror(error ){
    pprint('there was an error establishing the session')
  })
  cipher = new omemo._libsignal.SessionCipher(myStore, theirAddress)
  return { SessionCipher: cipher }
}

omemo.getSerialized = function(jid) {
  let res = omemo._storage.getItem('OMEMO'+jid)
  if (res != null) {
    return  res
  }
  return "nothing found to return"
}
omemo._onMessage = function(stanza) {
  $(document).trigger('msgreceived.omemo', [decryptedMessage, stanza]);
}
omemo.OmemoBundleMsgToSTore = function (receivedBundleMsg) {

}


module.exports = omemo
window.omemo = omemo

pprint("registering with Strophe")
Strophe.addConnectionPlugin('omemo', omemo);
pprint("done")
