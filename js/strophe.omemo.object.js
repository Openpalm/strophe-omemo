/*jslint browser: true, regexp: true */
/*global jQuery, $ */

/* vim: set ft=javascript: */
"use strict";

let $ = require('jquery')
let codec = require('./codec.js')
let gcm = require('./gcm.js')
let OmemoStore = require('./omemoStore.js')
let protocol = 'OMEMO'

function pprint(t) {
  console.log("strophe.omemo.js: " + t)
}

let Omemo = function (jid, deviceid, libsig, store, omemoStore) { //deviceid = registration id.
  this._jid = jid
  this._storage = window.localStorage
  this._address = null
  this._gcm = gcm
  this._codec = codec
  this._sessionBuilder = null
  this._connection = null
  this._store = store
  this._libsignal = libsig
  this._keyhelper = libsig.KeyHelper
  this._deviceid = deviceid  //refactor into registrationId.
  this._ns_main = 'eu.siacs.conversations.axolotl'
  this._ns_bundles =  'eu.siacs.conversations.axolotl.bundles'
  this._ns_devices = 'eu.siacs.conversations.axolotl.devices'
  this._ready = false
  this._omemoStore =  omemoStore
}
Omemo.prototype = {
  init: function(ctxt = this) {
    if (ctxt._storage.getItem('OMEMO'+ ctxt._jid) != null) {
      pprint("pre-existing store found. restoring ...")
      ctxt._store = ctxt.restore(ctxt._storage.getItem('OMEMO'+ ctxt._jid))
      ctxt._address = new ctxt._libsignal.SignalProtocolAddress(ctxt._jid, ctxt._store.get("registrationId"))
      return Promise.resolve(true)
    }
    ctxt.gen100PreKeys(1,100, ctxt).then(
      ctxt.armLibsignal(ctxt)
    )
    ctxt._ready = true
    return Promise.resolve(true)
    //conn.addHandler(this._onMessage.bind(this), null, 'message');
  },
  setNewDeviceId: function () {
    let minDeviceId = 1
    let maxDeviceId = 2147483647
    let diff = (maxDeviceId - minDeviceId)
    let res = Math.floor(Math.random() * diff  + minDeviceId)
    ctxt._deviceid = res
    ctxt._store.put('sid', res)
    return Promise.resolve(res)
  },
  armLibsignal: function(ctxt = this) {
    new Promise (
      function (resolve, reject) {
        pprint("first use! arming libsignal with fresh keys... ")
        if (ctxt._store == null) {
          throw new Error("no store set, terminating.")
        }
        let KeyHelper = ctxt._keyhelper
        let registrationId = ''
        Promise.all([
          KeyHelper.generateIdentityKeyPair(),
          KeyHelper.generateRegistrationId(), //supply manually.
        ]).then(function(result) {
          let identity = result[0];
          if (ctxt._deviceid === undefined) {
            registrationId = result[1]
          } else {
            registrationId = ctxt._deviceid
          }
          ctxt._store.put('registrationId', registrationId)
          ctxt._store.identifier = ctxt._jid
          ctxt._store.saveIdentity(ctxt._jid, result[0])
          ctxt._store.loadIdentityKey(ctxt._jid).then((ikey) =>
          ctxt._keyhelper.generateSignedPreKey(ikey, 1)).then((skey) => {
            ctxt._store.storeSignedPreKey(1, skey)
          })
          ctxt._address = new libsignal.SignalProtocolAddress(ctxt._jid, ctxt._store.get('registrationId'));
          pprint("libsignal armed for " + ctxt._jid + '.' + ctxt._store.get('registrationId'))
        })
        resolve(true)
      }
    )
  },
  gen100PreKeys: function (start, finish, ctxt, counter) {
    if (start == finish+1)  {
      return Promise.resolve(true)
    }
    let index = start
    ctxt._keyhelper.generatePreKey(index).then((k) =>  {
      ctxt._store.storePreKey(index,k)
    })
    start++
    return Promise.resolve(ctxt.gen100PreKeys(start, finish, ctxt))
  },
  refreshPreKeys: function(ctxt = this) {
    if (ctxt._store == null) {
      throw Exception("no store set, can not refresh.")
    }
    pprint("refreshing one time PreKeys")
    for (let i = 0; i < 100; i++) {
      ctxt._keyhelper.generatePreKey(i)
      .then((keyPair) => ctxt._store.storePreKey(i, keyPair))
      .then("one time key generation completed")
    }
    return Promise.resolve(true)
  },
  serialize: function(ctxt = this) {
    let sk_id = ctxt._store.currentSignedPreKeyId
    let sk_prefix = '25519KeysignedKey'
    let res = {}
    res.usedPreKeyCounter = ctxt._store.usedPreKeyCounter
    res.currentSignedPreKeyId = ctxt._store.currentSignedPreKeyId
    res.jid = ctxt._jid
    res.registrationId = ctxt._store.get("registrationId")
    res[sk_prefix + sk_id] = {
      keyId: sk_id,
      keyPair: {
        pubKey: codec.BufferToBase64(ctxt._store.get(sk_prefix + sk_id).keyPair.pubKey),
        privKey: codec.BufferToBase64(ctxt._store.get(sk_prefix + sk_id).keyPair.privKey)
      },
      signature:  codec.BufferToBase64(ctxt._store.get(sk_prefix + sk_id).signature)
    }
    res.identityKey =  {
      pubKey: codec.BufferToBase64(ctxt._store.get('identityKey').pubKey),
      privKey: codec.BufferToBase64(ctxt._store.get('identityKey').privKey)
    }
    let keys = ctxt._store.getPreKeys(ctxt= this)
    keys.forEach(function(key) {
      res['25519KeypreKey' + key.keyId] =  {
        pubKey: codec.BufferToBase64(key.keyPair.pubKey),
        privKey: codec.BufferToBase64(key.keyPair.privKey),
      }
    })
    res = JSON.stringify(res)
    let me = 'OMEMO' + ctxt._jid
    ctxt._storage.setItem(me, res)
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
        pubKey:   codec.BufferToBase64ToBuffer(serialized[sk_record].keyPair.pubKey),
        privKey:  codec.BufferToBase64ToBuffer(serialized[sk_record].keyPair.privKey)
      },
      signature: codec.BufferToBase64ToBuffer(serialized[sk_record].signature)
    }
    res.store.identityKey =  {
      pubKey:   codec.BufferToBase64ToBuffer(serialized.identityKey.pubKey),
      privKey:  codec.BufferToBase64ToBuffer(serialized.identityKey.privKey)
    }
    let prefix = '25519KeypreKey'
    let key = ''
    for (let keyId = 1; keyId <= 100; keyId++) {
      key = serialized[prefix + keyId]
      res.store[prefix + keyId] =  {
        keyId: keyId,
        keyPair: {
          pubKey: codec.BufferToBase64ToBuffer(key.pubKey),
          privKey: codec.BufferToBase64ToBuffer(key.privKey)
        }
      }
    }
    pprint("libsignal store for " + res.store.jid + " recreated")
    return res
  },
  buildSession: function (theirPublicBundle, theirJid, ctxt = this) {
    let myStore = ctxt._store
    let theirAddress = new ctxt._libsignal.SignalProtocolAddress(theirJid, theirPublicBundle.registrationId)
    let myBuilder = new ctxt._libsignal.SessionBuilder(ctxt._store, theirAddress)
    let cipher = ''

    let session = myBuilder.processPreKey(theirPublicBundle)
    session.then( function onsuccess(){
      pprint('session successfully established')
    })
    session.catch( function onerror(error ){
      pprint('there was an error establishing the session')
    })

    cipher = new ctxt._libsignal.SessionCipher(myStore, theirAddress)
    ctxt._omemoStore.add(theirJid, cipher, true)
    return Promise.resolve({ SessionCipher: cipher, preKeyId: theirPublicBundle.preKey.keyId })
  },
  getSerialized: function(ctxt) {
    let res = ctxt._storage.getItem('OMEMO'+ctxt._jid)
    if (res != null) {
      return res
    }
    return "no serialized store for " + ctxt._jid + " found to return"
  },
  createFetchBundleStanza: function(to, device, ctxt = this) {
    let res = $iq({type: 'get', from: ctxt._jid, to: to, id: 'fetch1'})
    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
    .c('items', {node: ctxt._ns_bundles + ":" + device}) // could consider to as an array of friends afterwards.

    return Promise.resolve(res)
  },
  createAnnounceBundleStanza: function (ctxt = this) {
    let store = ctxt._store
    let sk_id = store.currentSignedPreKeyId

    return store.loadSignedPreKey(sk_id).then(sk =>
      store.getIdentityKeyPair().then(ikp =>
        store.loadSignedPreKeySignature(sk_id).then(signature => {
          let signature64 = codec.BufferToBase64(signature)
          let sk64 = codec.BufferToBase64(sk.pubKey)
          let ik64 = codec.BufferToBase64(ikp.pubKey)
          console.log(sk.id)
          let res = $iq({type: 'set', from: ctxt._jid, id: 'anounce2'})
          .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
          .c('publish', {node: ctxt._ns_bundles + ":" + ctxt._store.get('registrationId')})
          .c('item')
          .c('bundle', {xmlns: ctxt._ns_main})
          .c('signedPreKeyPublic', {signedPreKeyId: sk_id}).t(sk64).up()
          .c('signedPreKeySignature').t(signature64).up()
          .c('identityKey').t(ik64).up()
          .c('prekeys')

          let keys = ctxt._store.getPreKeyBundle(ctxt)
          keys.forEach(function(key) {
            res = res.c('preKeyPub', {'keyId': key.keyId}).t(codec.BufferToBase64(key.pubKey)).up()
          })
          return res
        })
      )
    )
  },

  createEncryptedStanza: function(to, msgObj, keyMessage = false ,ctxt = this) {
    //if keyMessage is true, then the message is a key-material transport message
    //alice.createEncryptedStanza("bob@jiddy.jid", aliceFirstMsgObj).then(o => res = o)
    //alice.createEncryptedStanza("bob@jiddy.jid", aliceFirstMsgObj, true).then(o => res = o)

    let tag = msgObj.ENFORCED.tag
    let keyCipherText = msgObj.LSPLD
    let promises = []
    let jidSessions = ctxt._omemoStore.getSessions(to)
    let record, xml, enforced64

    xml = $msg({to: to, from: ctxt._jid, id1: 'send1'})
    xml.c('encrypted', {xmlns: ctxt._ns_main })
    xml.c('header', {sid: ctxt._deviceid })

    if (jidSessions === undefined) {
      console.log("No sessions with " + to + " found.\nEstablish a session first.")
      return Promise.reject()
    } else {
      //start else

      promises.push(
        ctxt._omemoStore.encryptPayloadsForSession(to, keyCipherText, tag, ctxt).then(o => {
          //start promise block

          for (let rid in jidSessions)  {
            record = jidSessions[rid]
            xml.c('key', {prekey: record.preKeyFlag, rid: rid}).t(record.payload).up()
          }

          xml.c('iv').t(msgObj.ENFORCED.iv).up()

          //are we sending keying material or text messages?
          if (!keyMessage) {
            xml.up()
            xml.c('payload').t(msgObj.ENFORCED.cipherText)
            xml.up().up()
            xml.c('store', {xmlns: 'urn:xmpp:hints'})
          } else {
            xml.up().up()
            xml.c('store', {xmlns: 'urn:xmpp:hints'})
          }

          return xml
          //end promise block
        })
        //promises.push end
      )
      //end else
    }
    //final return
    return Promise.all(promises).then(xml_out =>{
      return xml_out[0]
    })
  },

  createDeviceStanza: function(ctxt = this) {
    //initial add. all other additions happen on receiving device updates.
    let res = $iq({type: 'set', from: ctxt._jid, id: 'anounce1'})
    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
    .c('publish', {node: ctxt._ns_devices})
    .c('item')
    .c('list', {xmlns: ctxt._ns_main})
    .c('device', {id: ctxt._deviceid  }).up()

    return Promise.resolve(res)
  },

  _onDevice: function(stanza, ctxt = this) {
    //handles device updates. adds devices to omemoStore,
    // fetches bundle if not ours, and is not already there.
    // establishes ? consult richard.
    let parsed = $.parseXML(stanza)

    console.log(parsed.childNodes[0].nodeName)
  },
  _onBundle: function(stanza, ctxt = this) {
    //creates an OmemoBundle instance for a received bundle

    let codec = ctxt._codec
    let exists = false
    let parsed = $.parseXML(stanza)

    let bundle = new PublicOmemoStore()

    let keys = {}

    $(parsed).find('iq').each(function () {
      bundle.jid = $(this).attr('from')
    })
    $(parsed).find('signedPreKeyPublic').each(function () {
      bundle.signedPreKey.keyId = parseInt($(this).attr('signedPreKeyId'))
      bundle.signedPreKey.publicKey = codec.Base64ToBuffer($(this).text())
    })
    $(parsed).find('signedPreKeySignature').each(function () {
      bundle.signedPreKey.signature = codec.Base64ToBuffer($(this).text())
    })
    $(parsed).find('publish').each(function () {
      bundle.rid = parseInt($(this).attr('node').split(":")[1])
    })
    $(parsed).find('preKeyPub').each(function () {
      let key = codec.Base64ToBuffer($(this).text())
      let id = $(this).attr('keyId')
//      keys.push({key: key , id: id})
      bundle.putPreKey(id,key)
    })
    $(parsed).find('identityKey').each(function () {
      bundle.identityKey = codec.Base64ToBuffer($(this).text())
    })

    //bundle
    let record = ctxt._omemoStore.Sessions[bundle.jid]
    if (record === undefined ) {
      console.log("bundle undefined")
      ctxt._omemoStore.Sessions[bundle.jid] = {}
      record[bundle.rid] = {}
    }
    // cipher

    record[bundle.rid].bundle = bundle

//    let cipher = ctxt._omemoStore[bundle.jid][bundle.rid].cipher
//    let preKeyFlag = ctxt._omemoStore[bundle.jid][bundle.rid].preKeyFlag
//
//    if (cipher === undefined ) {
//      //establish a connection
//    record[bundle.rid].preKeyFlag = true
//    } else {
//      //cipher already exists. it's a preKeyUpdate
//      // we keep the old cipher until it's torn down.
//      cipher = record[bundle.rid].cipher
//      record[bundle.rid].preKeyFlag = preKeyFlag
//    }
//
//
//    record[bundle.rid].cipher = cipher

    return  record

  },
  _onMessage: function(stanza) {
    // handles receiving <message> xmpp messages.
    // advances the chains by calling decrypt
    // deciphers if payload exists
    // republishes bundle on prekeymessages
    let parsed = $.parseXML(stanza)
    console.log(parsed.childNodes[0].nodeName)
    let decryptedMessage = ""
//    $(document).trigger('msgreceived.omemo', [decryptedMessage, stanza]);
  },
}

Strophe.addNamespace(protocol, this._ns_main);
Strophe.addConnectionPlugin('omemo', Omemo);

window.Omemo = Omemo
