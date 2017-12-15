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
    let promises = []
    promises.push(ctxt.armLibsignal(ctxt))
    return Promise.all(promises).then( function () {
      ctxt._ready = true
    })
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
    pprint("first use! arming libsignal with fresh keys... ")
    if (ctxt._store == null) {
      throw new Error("no store set, terminating.")
    }
    let KeyHelper = ctxt._keyhelper
    let registrationId = ''
    Promise.all([
      KeyHelper.generateIdentityKeyPair(),
      ctxt.genPreKeys(100, ctxt)
    ]).then(function(result) {
      let identity = result[0];
      registrationId = ctxt._deviceid
      ctxt._store.put('registrationId', registrationId)
      ctxt._store.put('identityKey', result[0])
      ctxt._store.getIdentityKeyPair().then((ikey) =>
      ctxt._keyhelper.generateSignedPreKey(ikey, 1)).then((skey) => {
        console.log(skey)
        let key = {
          pubKey: skey.keyPair.pubKey,
          privKey: skey.keyPair.privKey,
          keyId: skey.keyId,
          signature: skey.signature
        }
        ctxt._store.storeSignedPreKey(1, key)
      })
      ctxt._address = new libsignal.SignalProtocolAddress(ctxt._jid, ctxt._store.get('registrationId'));
    }).then( console.log("done arming"))
  },
  //  gen100PreKeys: function (start, finish, ctxt, counter) {
  //    if (start == finish+1)  {
  //      return Promise.resolve(true)
  //    }
  //    let index = start
  //    ctxt._keyhelper.generatePreKey(index).then((k) =>  {
  //      ctxt._store.storePreKey(index,k)
  //    })
  //    start++
  //    return Promise.resolve(ctxt.gen100PreKeys(start, finish, ctxt))
  //  },

  genPreKeys: function (range, ctxt = this) {
    let promises = []
    for (let i = 1; i < range + 1; i++ ) {
      promises.push(ctxt._keyhelper.generatePreKey(i).then((k) =>  {
        let key = {pubKey: k.keyPair.pubKey, privKey: k.keyPair.privKey, keyId: k.keyId}
        ctxt._store.storePreKey(i,key)
      })
    )
  }
  return Promise.all(promises).then(console.log("generated preKeys"))
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
},

getSerialized: function(ctxt) {
},
buildSession: function (theirPublicBundle, theirJid, ctxt = this) {
  console.log("building session with " + theirJid)
  let myStore = ctxt._store
  let deviceId = theirPublicBundle.registrationId
  let theirAddress = new ctxt._libsignal.SignalProtocolAddress(theirJid, deviceId)
  let myBuilder = new ctxt._libsignal.SessionBuilder(myStore, theirAddress)
  let cipher = ''

  let session = myBuilder.processPreKey(theirPublicBundle)
  return session.then( function onsuccess(){
    pprint('session successfully established')
    cipher = new ctxt._libsignal.SessionCipher(myStore, theirAddress)
    return cipher
  })
  session.catch( function onerror(error ){
    pprint('there was an error establishing the session')
    return Promise.reject()
  })
  return Promise.resolve(cipher)

},
createFetchBundleStanza: function(to, device, ctxt = this) {
  let res = $iq({type: 'get', from: ctxt._jid, to: to, id: 'fetch1'})
  .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
  .c('items', {node: ctxt._ns_bundles + ":" + device}) // could consider to as an array of friends afterwards.

  return Promise.resolve(res)
},
createAnnounceBundleStanza: function (ctxt = this) {
  let store = ctxt._store
  let sk_id = 1

  let promises = [
    ctxt._store.loadSignedPreKey(sk_id),
    ctxt._store.getIdentityKeyPair(),
    ctxt._store.loadSignedPreKeySignature(sk_id),
    ctxt._store.getLocalRegistrationId()
  ]
  return Promise.all(promises).then(o => {
    let sk = o[0]
    let ikp = o[1]
    let signature = o[2]
      let rid = o[3]
      let signature64 = codec.BufferToBase64(signature)
      let sk64 = codec.BufferToBase64(sk.pubKey)
    let ik64 = codec.BufferToBase64(ikp.pubKey)
    let res = $iq({type: 'set', from: ctxt._jid, id: 'anounce2'})
    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
    .c('publish', {node: ctxt._ns_bundles + ":" + rid })
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

    return Promise.resolve(res)
  })
},

createEncryptedStanza: function(to, msgObj, keyMessage = false ,ctxt = this) {
  //if keyMessage is true, then the message is a key-material transport message
  //alice.createEncryptedStanza("bob@jiddy.jid", aliceFirstMsgObj).then(o => res = o)
  //alice.createEncryptedStanza("bob@jiddy.jid", aliceFirstMsgObj, true).then(o => res = o)
  let jidSessions = ctxt._omemoStore.getSessions(to)

  if (jidSessions === undefined) {
    return Promise.reject("no session exists for " + to)
  }

  let tag = msgObj.ENFORCED.tag
  let keyCipherText = msgObj.LSPLD
  let promises = []


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

        for (let rid in jidSessions)  {
          record = jidSessions[rid]
          xml.c('key', {prekey: record.get('preKeyFlag'), rid: rid}).t(record.payload).up()
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
  return Promise.all(promises).then(out =>{
    return out[0]
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
  //TODO handle our own bundle. we need to update our prekeys
  //and count them.
  //creates an OmemoBundle instance for a received bundle
  if (stanza === undefined) {
    pprint("attempted to parse null stanza")
    return
  }
  let codec = ctxt._codec
  let exists = false
  let parsed = $.parseXML(stanza)
  let promises = []
  let rid, bundle, publicBundle, prekeyCount

  $(parsed).find('publish').each(function () {
    rid = parseInt($(this).attr('node').split(":")[1])
  })

  try {
    bundle = ctxt._omemoStore.Sessions[bundle.jid][rid]
  } catch (e) {
    bundle = new PublicOmemoStore()
  }

  bundle.rid = rid

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
  $(parsed).find('preKeyPub').each(function () {
    let key = codec.Base64ToBuffer($(this).text())
    let id = $(this).attr('keyId')

    bundle.putPreKey(id,key)
  })
  $(parsed).find('identityKey').each(function () {
    bundle.identityKey = codec.Base64ToBuffer($(this).text())
  })
  //bundle
  let record = ctxt._omemoStore.Sessions[bundle.jid]
  if (record === undefined ) {
    console.log("new bundle")
    ctxt._omemoStore.Sessions[bundle.jid] = {}
    record = ctxt._omemoStore.Sessions[bundle.jid]
    bundle.put("preKeyFlag", true)
    publicBundle = bundle.getPublicBundle()
    bundle.publicBundle = publicBundle
    let p = ctxt.buildSession(publicBundle, bundle.jid, ctxt)
    promises.push(p)
    return Promise.all(promises).then(res => {
      bundle.putCipher(res[0])
      bundle.put("preKeyFlag", true)
      record[rid] = bundle
      return Promise.resolve(record[rid])
    })
  } else {
    if (record[bundle.rid] === undefined) {

      publicBundle = bundle.getPublicBundle()
      let p = ctxt.buildSession(publicBundle, bundle.jid, ctxt)
      promises.push(p)

      return Promise.all(promises).then(res => {
        bundle.putCipher(res[0])
        bundle.put("preKeyFlag", true)
        record[rid] = bundle
        return Promise.resolve(record[rid])

      })
    } else {

      console.log("record exists, refreshing bundle for " + bundle.jid + ":" + bundle.rid)
      //fetching here since we overwrite the whole bundle
      let cipher = record[bundle.rid].getCipher()
      bundle.putCipher(cipher)
      let pkf = record[bundle.rid].get("preKeyFlag")
      bundle.put("preKeyFlag", pkf)
      record[rid] = bundle
      return Promise.resolve(record[rid])

    }
  }

},

_onMessage: function(stanza, ctxt = this) {
  if (stanza === undefined) {
    pprint("attempted to parse null stanza")
    return
  }

  let gcm = ctxt._gcm
  let parsed = $.parseXML(stanza)
  let promises = []
  let rid, jid, sid, bundle, publicBundle, temp_rid
  let keyAndTag, iv, payload, preKeyFlag
  let decryptedMessage = ""

  $(parsed).find('message').each(function () {
    jid = $(this).attr('from')
  })

  $(parsed).find('payload').each(function () {
    payload = $(this).text()
  })
  $(parsed).find('header').each(function () {
    sid = parseInt($(this).attr('sid'))
  })

  $(parsed).find('key').each(function () {
    temp_rid = parseInt($(this).attr('rid'))
    if (temp_rid == ctxt._deviceid) {
      preKeyFlag = $(this).attr('prekey')
      keyAndTag = $(this).text()
    }
  })

  $(parsed).find('iv').each(function () {
    iv = $(this).text()
  })

  iv = codec.Base64ToBuffer(iv)
  payload = codec.Base64ToBuffer(payload)
//  console.log(iv)
//  console.log(payload)

  let theirAddress = new ctxt._libsignal.SignalProtocolAddress(jid, sid)
  let txtPayload = ctxt._codec.Base64ToString(keyAndTag) //aught to turn this into an assert
  if (preKeyFlag) {
  let cipher = new libsignal.SessionCipher(ctxt._store, theirAddress)
    //create omemoBundle entry if non exist,
    //decryptPreKeyWhisperMessage

    //let txtPayload = ctxt._omemoStore.Sessions["bob@jiddy.jid"][222].original
    promises.push(cipher.decryptPreKeyWhisperMessage(txtPayload, 'binary'))
    return Promise.all(promises).then(res => {
      let tuple = gcm.getKeyAndTag(codec.BufferToString(res[0]))
      let key = tuple.key
      let tag = tuple.tag // might be useless.
      //overwrite old cipher
      //create new omemoBundle entry if none exists for both jid and rid

      return gcm.decrypt(key, payload, iv).then(decryptedMessage => {
        console.log(decryptedMessage)
        preKeyFlag = false
        ctxt._omemoStore.putCipher(jid, sid, cipher, preKeyFlag)
        return  $(document).trigger('msgreceived.omemo', [decryptedMessage, stanza]);
      })

      // extract tag, gcm decrypt and assign decryptedMessage
      // console.log("preKey message: " + res)
      //  gcm.decrypt()
      //return    $(document).trigger('msgreceived.omemo', [decryptedMessage, stanza]);
    })

  } else {
    //grab cipher from omemoBundle
    //decryptWhisperMessage

    let cipher = ctxt._omemoStore.getCipher(jid, sid)

    console.log("in else")
    promises.push(cipher.decryptWhisperMessage(txtPayload))
    Promise.all(promises).then(res => {
      let tuple = gcm.getKeyAndTag(codec.BufferToString(res[0]))
      let key = tuple.key
      let tag = tuple.tag // might be useless.

      return gcm.decrypt(key, payload, iv).then(decryptedMessage => {

        preKeyFlag = false
        ctxt._omemoStore.putCipher(jid, rid, cipher, preKeyFlag)
        console.log(decryptedMessage)
        return  $(document).trigger('msgreceived.omemo', [decryptedMessage, stanza]);
      })
    })
  }

},
}

Strophe.addNamespace(protocol, this._ns_main);
//Strophe.addConnectionPlugin('omemo', Omemo);

window.Omemo = Omemo
