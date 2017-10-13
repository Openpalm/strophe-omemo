/*jslint browser: true, regexp: true */
/*global jQuery, $ */

/* vim: set ft=javascript: */
"use strict";

let $ = require('jquery')
let codec = require('./codec.js')
let gcm = require('./gcm.js')
let protocol = 'OMEMO'

function pprint(t) {
  console.log("strophe.omemo.js: " + t)
}

let Omemo = function (jid, deviceid, libsig, store) { //deviceid = registration id.
  this._jid = jid 
  this._storage = window.localStorage
  this._address = null
  this._gcm =  gcm
  this._codec = codec
  this._sessionBuilder = null
  this._sessions = null
  this._connection = null
  this._store = store
  this._libsignal = libsig
  this._keyhelper = libsig.KeyHelper
  this._deviceid = deviceid 
  this._ns_main = 'eu.siacs.conversations.axolotl'
  this._ns_bundles =  'eu.siacs.conversations.axolotl.bundles'
  this._ns_devices = 'eu.siacs.conversations.axolotl.devices'
  this._ready = false
}
Omemo.prototype = {
  init: function(context) {
    if (context._storage.getItem('OMEMO'+ context._jid) != null) {
      pprint("pre-existing store found. restoring ...")
      context._store = context.restore(context._storage.getItem('OMEMO'+ context._jid))
      context._address = new context._libsignal.SignalProtocolAddress(context._jid, context._store.get("registrationId"))
      return
    }
    context.armLibsignal(context)
    context.gen100PreKeys(1,100, context)
    context._ready = true
    //conn.addHandler(this._onMessage.bind(this), null, 'message'); // ? strophe conn?
  },
  setNewDeviceId: function () {
    let minDeviceId = 1
    let maxDeviceId = 2147483647
    let diff = (maxDeviceId - minDeviceId)
    let res = Math.floor(Math.random() * diff  + minDeviceId) 
    context._deviceid = res
    context._store.put('sid', res)
    pprint("generated new device id: " + res)
  },
  armLibsignal:  function(context) {
    pprint("first use! arming libsignal with fresh keys... ")
    if (context._store == null) {
      throw new Error("no store set, terminating.")
    }
    let KeyHelper = context._keyhelper
    let registrationId = ''
    Promise.all([
      KeyHelper.generateIdentityKeyPair(),
      KeyHelper.generateRegistrationId(), //supply manually.
    ]).then(function(result) {
      let identity = result[0];
      if (context._id == null) {
        pprint('device id not supplied, using a randomly generated id')
        registrationId = result[1]
      } else {
        registrationId = context._deviceid
      }
      context._store.put('registrationId', registrationId)
      pprint("registration id generated and stored.")
      context._store.put('identityKey', result[0])
      pprint("identity Key generated and stored.")
      context._store.getIdentityKeyPair().then((ikey) => 
        context._keyhelper.generateSignedPreKey(ikey, 1)).then((skey) => {
          context._store.put('signedPreKey', skey)
          pprint("signed PreKey generated and stored.")
        })
      context._address = new libsignal.SignalProtocolAddress(context._jid, context._store.get('registrationId'));
      pprint("libsignal armed for " + context._jid + '.' + context._store.get('registrationId'))
    })
  },
  constructOwnXMPPBundle: function (store, context) { 
    let res = $iq({type: 'set', from: context._jid, id: 'anounce2'})
      .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
      .c('publish', {node:context._ns_bundles + ":" + context._store.get('registrationId')})
      .c('item')
      .c('bundle', {xmlns: this._ns_main}) 
      .c('signedPreKeyPublic', {signedPreKeyId: this._store.get('signedPreKey').keyId}).
      t(codec.b64encode(this._store.get('signedPreKey').keyPair.pubKey)).up()
      .c('signedPreKeySignature')
      .t(codec.b64encode(this._store.get('signedPreKey').signature)).up()
      .c('identityKey')
      .t(codec.b64encode(this._store.get('identityKey').pubKey)).up()
      .c('prekeys')
    let keys = context._store.getPreKeyBundle()
    keys.forEach(function(key) { 
      res = res.c('preKeyPub', {'keyId': key.keyId}).t(codec.b64encode(key.pubKey)).up()
    })
    return res
  },
  gen100PreKeys: function (start, finish, context) { 
    if (start == finish+1)  { 
      pprint("100preKey genereration complete")
      return
    }
    let index = start  //cant use start. since storePreKey is a promise, and since start++ happens
    //the value of start in relation to k is off by 1 by the time the promise resolves.
    //settins index = start solves this.
    context._keyhelper.generatePreKey(index).then((k) => context._store.storePreKey(index,k))
    start++

    context.gen100PreKeys(start, finish, context)
  },
  refreshPreKeys: function(context) {
    if (context._store == null) {
      throw Exception("no store set, can not refresh.")
    }
    pprint("refreshing one time PreKeys")
    for (let i = 0; i < 100; i++) {
      context._keyhelper.generatePreKey(i)
        .then((keyPair) => context._store.storePreKey(i, keyPair))
        .then("one time key generation done")
    }
  },
  serialize: function(context) {
    let res = {}
    res.jid = this._jid
    res.registrationId = this._store.get("registrationId")
    res.signedPreKey = { 
      keyId: this._store.get('signedPreKey').keyId,
      keyPair: { 
        pubKey: codec.b64encode(this._store.get('signedPreKey').keyPair.pubKey), 
        privKey: codec.b64encode(this._store.get('signedPreKey').keyPair.privKey)
      },
      signature:  codec.b64encode(this._store.get('signedPreKey').signature)
    }
    res.identityKey =  { 
      pubKey: codec.b64encode(this._store.get('identityKey').pubKey), 
      privKey: codec.b64encode(this._store.get('identityKey').privKey)
    }
    let keys = this._store.getPreKeys()
    keys.forEach(function(key) { 
      res['25519KeypreKey' + key.keyId] =  { 
        pubKey: codec.b64encode(key.keyPair.pubKey), 
        privKey: codec.b64encode(key.keyPair.privKey), 
      }
    })
    res = JSON.stringify(res)
    let me = 'OMEMO' + this._jid
    context._storage.setItem(me, res)
  },
  restore: function (serialized) {
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
  },
  createEncryptedStanza: function(to, plaintext) {
    let encryptedStanza = new Strophe.Builder('encrypted', {
      xmlns: Strophe.NS.OMEMO
    });
    return encryptedStanza;
  },
  buildSession: function (theirStore, theirJid) {
    let target = theirStore.get('jid') + '.' + theirStore.get('registrationId')
    pprint('building session with ' + target)
    let myAddress =  this._address
    pprint('our own libsignal address record: ') 
    console.log(myAddress)
    pprint('importing our own store')
    let myStore = this._store
    console.log(myStore)
    let theirAddress = new this._libsignal.SignalProtocolAddress(theirStore.store.jid, theirStore.store.registrationId)
    pprint('creating a libsignal address recrod from their Store:')
    console.log(theirAddress)
    pprint('extracting a preKey record from their store ')
    let theirSessionBundle =  theirStore.getSessionBuilderBundle() //should be a /public/ keystore from a received bundle
    console.log(theirSessionBundle)
    let myBuilder = new this._libsignal.SessionBuilder(this._store, theirAddress)
    pprint('building session, processing PreKey record:')
    let cipher = ''
    let session = myBuilder.processPreKey(theirSessionBundle)
    session.then( function onsuccess(){
      pprint('session successfully established')
    })
    session.catch( function onerror(error ){
      pprint('there was an error establishing the session')
    })
    cipher = new this._libsignal.SessionCipher(myStore, theirAddress)
    return { SessionCipher: cipher }
  },
  getSerialized: function(context) {
    let res = context._storage.getItem('OMEMO'+context._jid)
    if (res != null) {
      return  res
    }
    return "nothing found to return"
  },
  _onMessage: function(stanza) {
    $(document).trigger('msgreceived.omemo', [decryptedMessage, stanza]);
  },
  OmemoBundleMsgToSTore: function (receivedBundleMsg) {
  }
}

Strophe.addNamespace(protocol, this._ns_main);
Strophe.addConnectionPlugin('omemo', Omemo);
pprint("namespace loaded")

window.Omemo = Omemo

pprint("loaded the testing version of omemo")
