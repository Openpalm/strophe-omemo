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
  this._gcm = gcm
  this._codec = codec
  this._sessionBuilder = null
  this._sessions = null
  this._connection = null
  this._store = store
  this._libsignal = libsig
  this._keyhelper = libsig.KeyHelper
  this._deviceid = deviceid  //refactor into registrationId.
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
      return Promise.resolve(true)
    }
    context.gen100PreKeys(1,100, context).then(
      context.armLibsignal(context)
    )
    context._ready = true
    return Promise.resolve(true)
    //conn.addHandler(this._onMessage.bind(this), null, 'message');
  },
  setNewDeviceId: function () {
    let minDeviceId = 1
    let maxDeviceId = 2147483647
    let diff = (maxDeviceId - minDeviceId)
    let res = Math.floor(Math.random() * diff  + minDeviceId)
    context._deviceid = res
    context._store.put('sid', res)
    return Promise.resolve(res)
  },
  armLibsignal: function(context) {
    new Promise (
      function (resolve, reject) {
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
          if (context._deviceid === undefined) {
            registrationId = result[1]
          } else {
            registrationId = context._deviceid
          }
          context._store.put('registrationId', registrationId)
          context._store.identifier = context._jid
          context._store.saveIdentity(context._jid, result[0])
          context._store.loadIdentityKey(context._jid).then((ikey) =>
            context._keyhelper.generateSignedPreKey(ikey, 1)).then((skey) => {
              context._store.storeSignedPreKey(1, skey)
            })
          context._address = new libsignal.SignalProtocolAddress(context._jid, context._store.get('registrationId'));
          pprint("libsignal armed for " + context._jid + '.' + context._store.get('registrationId'))
        })
        resolve(true)
      }
    )
  },
    gen100PreKeys: function (start, finish, context, counter) {
    if (start == finish+1)  {
      return Promise.resolve(true)
    }
    let index = start
    context._keyhelper.generatePreKey(index).then((k) =>  {
      context._store.storePreKey(index,k)
    })
    start++
    return Promise.resolve(context.gen100PreKeys(start, finish, context))
  },
  refreshPreKeys: function(context) {
    if (context._store == null) {
      throw Exception("no store set, can not refresh.")
    }
    pprint("refreshing one time PreKeys")
    for (let i = 0; i < 100; i++) {
      context._keyhelper.generatePreKey(i)
        .then((keyPair) => context._store.storePreKey(i, keyPair))
        .then("one time key generation completed")
    }
    return Promise.resolve(true)
  },
  serialize: function(context) {
    let sk_id = context._store.currentSignedPreKeyId
    let sk_prefix = '25519KeysignedKey'
    let res = {}
    res.usedPreKeyCounter = context._store.usedPreKeyCounter
    res.currentSignedPreKeyId = context._store.currentSignedPreKeyId
    res.jid = context._jid
    res.registrationId = context._store.get("registrationId")
    res[sk_prefix + sk_id] = {
      keyId: sk_id,
      keyPair: {
        pubKey: codec.b64encode(context._store.get(sk_prefix + sk_id).keyPair.pubKey),
        privKey: codec.b64encode(context._store.get(sk_prefix + sk_id).keyPair.privKey)
      },
      signature:  codec.b64encode(context._store.get(sk_prefix + sk_id).signature)
    }
    res.identityKey =  {
      pubKey: codec.b64encode(context._store.get('identityKey').pubKey),
      privKey: codec.b64encode(context._store.get('identityKey').privKey)
    }
    let keys = context._store.getPreKeys(context)
    keys.forEach(function(key) {
      res['25519KeypreKey' + key.keyId] =  {
        pubKey: codec.b64encode(key.keyPair.pubKey),
        privKey: codec.b64encode(key.keyPair.privKey),
      }
    })
    res = JSON.stringify(res)
    let me = 'OMEMO' + context._jid
    context._storage.setItem(me, res)
  },
  restore: function (serialized) {
    //secondary priority, get decrypt to work.
    let sk_record = ''
    for (var v in bob._store.store) {
      // modify later for multiple signedpreKeys
      if ((v !== undefined) && (v.indexOf("Keysign") >= 0)) {
        sk_record = v
      }
    }
    let res = new SignalProtocolStore()
    serialized = JSON.parse(serialized)
    res.usedPreKeyCounter = serialized.usedPreKeyCounter
    res.currentSignedPreKeyId = serialized.currentSignedPreKeyId
    res.store.jid = serialized.jid
    res.store.registrationId = serialized.registrationId
    console.log(sk_record)
    res.store[sk_record] = {
      keyId: serialized[sk_record].keyId,
      keyPair: {
        pubKey:   codec.b64encodeToBuffer(serialized[sk_record].keyPair.pubKey),
        privKey:  codec.b64encodeToBuffer(serialized[sk_record].keyPair.privKey)
      },
      signature: codec.b64encodeToBuffer(serialized[sk_record].signature)
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
          pubKey: codec.b64encodeToBuffer(key.pubKey),
          privKey: codec.b64encodeToBuffer(key.privKey)
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
  buildSession: function (theirPublicBundle, theirJid, context) {
    let myStore = context._store
    let theirAddress = new context._libsignal.SignalProtocolAddress(theirJid, theirPublicBundle.registrationId)
    let myBuilder = new context._libsignal.SessionBuilder(context._store, theirAddress)
    let cipher = ''

    let session = myBuilder.processPreKey(theirPublicBundle)
    session.then( function onsuccess(){
      pprint('session successfully established')
    })
    session.catch( function onerror(error ){
      pprint('there was an error establishing the session')
    })

    cipher = new context._libsignal.SessionCipher(myStore, theirAddress)
    return Promise.resolve({ SessionCipher: cipher, preKeyId: theirPublicBundle.preKey.keyId })
  },
  getSerialized: function(context) {
    let res = context._storage.getItem('OMEMO'+context._jid)
    if (res != null) {
      return res
    }
    return "no serialized store for " + context._jid + " found to return"
  },
  createFetchBundleStanza: function(to, device) {
   let res = $iq({type: 'get', from: self._jid, to: to, id: 'fetch1'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
            .c('items', {node: self._ns_bundles + ":" + device})

   return Promise.resolve(res)
  },
  createAnnounceBundleStanza: function (context) {
    let store = context._store
    let sk_id = store.currentSignedPreKeyId

    return store.loadSignedPreKey(sk_id).then(sk =>
      store.getIdentityKeyPair().then(ikp =>
        store.loadSignedPreKeySignature(sk_id).then(signature => {
          let signature64 = codec.b64encode(signature)
          let sk64 = codec.b64encode(sk.pubKey)
          let ik64 = codec.b64encode(ikp.pubKey)
          console.log(sk.id)
          let res = $iq({type: 'set', from: context._jid, id: 'anounce2'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
            .c('publish', {node:context._ns_bundles + ":" + context._store.get('registrationId')})
            .c('item')
            .c('bundle', {xmlns: this._ns_main})
            .c('signedPreKeyPublic', {signedPreKeyId: sk_id}).t(sk64).up()
            .c('signedPreKeySignature').t(signature64).up()
            .c('identityKey').t(ik64).up()
            .c('prekeys')
          let keys = context._store.getPreKeyBundle(context)
          keys.forEach(function(key) {
            res = res.c('preKeyPub', {'keyId': key.keyId}).t(codec.b64encode(key.pubKey)).up()
          })
          return res
        })
      )
    )
  },


  createEncryptedStanza: function(to, msgObj, prekeyToggle) {
    let res = $msg({to: to, from:self._jid, id1: 'send1'})
          .c('encrypted', {xmlns: self._ns_main })
          .c('header', {sid: self._deviceid })
          .c('key', {prekey: prekeyToggle, rid: to}).up()
        //  .iv()
        //  .t(codec.b64encode(msgObj.iv)).up()
          return res
  },

  createPreKeyStanza: function(to, id) {

  },

  createDeviceUpdateStanza: function(id) {

  },

  handleDeviceUpdate: function(id) {

  },

  OmemoBundleXMLToSTore: function (receivedBundleMsg) {
	  //omemo store out or directly serialize to localStorage

  },

  receive: function (encXML) {

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
