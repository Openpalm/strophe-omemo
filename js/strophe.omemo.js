  "use strict";

  var $ = require('jquery'); //not used yet. candidate for deletion.
  var codec = require('./codec.js')
  var gcm = require('./gcm.js')
  //errors. var libsignal = require('./libs/libsignaljs/dist/libsignal-protocol.js')
  //var store= require('./store.js') // error in browser? needs to be in <script> form unless i figure out another way.

  function pprint(t) {
    console.log("strophe.omemo.js: " + t)
  }

  let ns = {}
  var protocol = 'OMEMO'

  pprint("initiating")

  //there's no need to import Strophe or $iq, taken from browser <script> tag.
  //not including it here reduces import strain.


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

  //testing iq and its output
  var iq = $iq({type: 'set', from:'eddie@mcjiddy.jid', id: 'anounce2' })
    .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
    .c('publish', {node: omemo._ns_main })

  pprint(iq) // yep it works.

  /**
   * init
   * initilizes omemo protocol.
   * sets entry point to libsignal
   * sets entry point to a libsignal store
   * arms and readies a session with keys
   *
   * @param libsignal entry point to libsignal-javascript.js
   * @param store LibSignalStore object
   * @param conn
   * @returns {true} on success, raises an Error otherwise.
   */
  omemo.init = function(libsignal, store, jid, conn) {
    //fix order using callbacks if necessary. session might have an issue with
    //the store being given as input before preKey generation finishes.
    //omemo._connection = conn;//strophe conn do we really need an omemo connection here ?
    omemo._jid = jid 
    omemo.setStore(store)
      .then(omemo.setNewDeviceId()) //generates a fresh device id. 
      .then(omemo.setLibsignal(libsignal)) // sets libsignal api-library entry point 
      .then(omemo.armLibsignal()) //generates the keys and readies the store

    return Promise.resolve(true) //comfort for .then()
    //conn.addHandler(this._onMessage.bind(this), null, 'message'); // ? strophe conn?
  }


  /**
   * addNewDevice
   * generates a new device ID and publishes it to the PEP node
   * handles any collisions that may happen on the PEP.
   *
   * @returns {true} on success, raises Error on failure
   */
  omemo.setNewDeviceId= function () {
    //min/max ought to be global, but it'd be poor design to declare them
    //somewhere vague. maybe. klaus can give a tip here.
    var minDeviceId = 1
    var maxDeviceId = 2147483647

    let diff = (maxDeviceId - minDeviceId)
    let res = Math.floor(Math.random() * diff  + minDeviceId) 
    omemo._deviceid = res
    omemo._store.put('sid', res)
    pprint("generated new device id: " + res)
    return Promise.resolve(true)
  }
  /**
   * setStore
   * sets omemo._store to a libsignal store interface
   *
   * @param store a LibSignalStore
   * @returns {true} on success, raises Error on failure
   */
  omemo.setStore = function (store) {
    //from <script> tag
    omemo._store = store 
    return Promise.resolve(true)
  }
  /**
   * setLibsignal
   *
   * @param ep LibSignal-javascript.js object
   * @returns {true} raises error on failure
   */
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


  /**
   * armLibsignal
   * arms libsignal with keys, attempts to restore
   * creates new if unable to restre
   *
   * assumes libsignal and KeyHelper are available.
   *
   * @returns {true} on success
   */
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
      //introduce callbacks into functions to manage order of instantiation.
      //introduce a ready flag.
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
    //establishes a libsignal session
    //prepares the way for sending

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
  //handles a received XMPP omemo bundle
  //transforms it into a libsignal store
  //should generate a store from the mock data

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
/**
 * generatePreKeys
 * generates a 100 preKeys, stores in store.
 * creates a preKeyPubRecord of keys for PEP
 *
 * @returns {true} on success, Error on failure
 */
/**
 * setUpMessageElements
 * handles XMPP syntax packing on query Omemo message types.
 * ==> better have a function for each of the tree types.
 * ==> PreKeySignalMessages. A client can receive a PreKeySignalMessage from 
 * ==> a recipient and use it to establish a session.
 * @param type
 * @param text
 * @returns {true} on success, Error on failure
 */
omemo.setUpMessageElements = function(type, text) {
  //set the message elements
  //handles type of message
  //1. preKeySignalMessage
  //2. signalMessage
  //3. presense of <payload>
}
/**
 * createEncryptedStanza
 * encrypts plaintext with GCM as per XEP 0384 v0.2
 * passes key to libsignal and passes it on to
 * finalizeMessageElements to ready for sending with
 * type encrypted.
 *
 * @param to
 * @param plaintext
 * @returns {true} on success, Error on failure
 */
omemo.createEncryptedStanza = function(to, plaintext) {
  var encryptedStanza = new Strophe.Builder('encrypted', {
    xmlns: Strophe.NS.OMEMO
  });

  //@TODO


  return encryptedStanza;
}
/**
 * _onMessage
 *
 * handles receiving messages.
 * unpacks messageKey using the libsignal session
 * decrypts using gcm.derypt()
 *
 * @param stanza
 * @returns {true} on success, Error on failure.
 */
omemo._onMessage = function(stanza) {
  //@TODO
  //@preKeySignalMessage
  //@
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
/**
 * restore
 *
 * attempts to restore a session from a saved JSON object
 s populates a fresh libSignalStore with content. assumes
 * JSON fields will match those of the store interface.
 *
 * JSON object will be padded with a device ID and idkey.pub.
 * optional: take device ID from PEP ?
 *
 * @param file or database object
 * @returns {true} on success, Error on failure
 */
omemo.restore = function(file) {

  return Promise.resolve(true)
}
/**
 * serialize
 * uses JSON.stringify to turn a store object into a JSON string.
 * padded with device id and idkey.pub.
 *
 * @param file or database containing the object
 *
 * @returns {true} on success, Error on failure
 */
omemo.serialize = function(file) {
  let serialized = JSON.stringify(omemo._store)
  return Promise.resolve(true)
  //do something with it. sqlite?
}


module.exports = omemo
window.omemo = omemo

pprint("registering with Strophe")
Strophe.addConnectionPlugin('omemo', omemo);
pprint("done")
