"use strict";

var $ = require('jquery');
var codec = require('./codec.js')
var gcm = require('./gcm.js')
//errors. var libsignal = require('./libs/libsignaljs/dist/libsignal-protocol.js')
//var store= require('./store.js') // error in browser? needs to be in <script> form unless i figure out another way.

function pprint(t) {
  console.log("strophe.omemo.js: " + t)
}

var ns = 'eu.siacs.conversations.axolotl'
var protocol = 'OMEMO'

pprint("initiating")

//there's no need to import Strophe or $iq, taken from browser <script> tag.
//not including it here reduces import strain.
Strophe.addNamespace(protocol, ns);
pprint("namespace successfully loaded")

//testing iq and its output
var iq = $iq({type: 'get', to: "jiddy@mcjiddijid.jid"}).c('query', {xmlns: 'http://jabber.org/protocol/pubsub#retrieve-subscriptions'});

//pprint(iq) // yep it works.


var omemo = {
  _connection: null,
  _store: null,
  _libsignal: null,
  _keyhelper: null,
  _deviceid: null
}

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
omemo.init = function(libsignal, store, conn) {
  this._connection = conn; //strophe conn
  pprint("initializing omemo")
  omemo.setStore(store)
  omemo.setNewDeviceId()
  omemo.setLibsignal(libsignal)
  omemo.armLibsignal()
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
  //somewhere vague.
  var minDeviceId = 1
  var maxDeviceId = 2147483647

  let diff = (maxDeviceId - minDeviceId)
  let res = Math.floor(Math.random() * diff  + minDeviceId) 
  omemo._deviceid = res
  omemo._store.put('sid', res)
  pprint("generated new device id: " + res)
}
/**
 * setStore
 * sets omemo._store to a libsignal store interface
 *
 * @param store a LibSignalStore
 * @returns {true} on success, raises Error on failure
 */
omemo.setStore = function (store) {
  //test on membership of put/get to determine if it's a store?
  //store imported. now loaded with <script>. works.
  omemo._store = store 
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
}

omemo.extractRandomPreKey = function() {

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
  omemo.gen100PreKeys(1,100)


}
omemo.gen100PreKeys = function (start, finish) {
  if (start == finish+1)  { 
    pprint("100preKey genereration complete")
    return 
  }
  omemo._keyhelper.generatePreKey(start).then((k) => omemo._store.storePreKey(start,k))
  start++
  omemo.gen100Keys(start, finish)
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
 *
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
  //do something with it. sqlite?
}


module.exports = omemo
window.omemo = omemo

pprint("registering with Strophe")
Strophe.addConnectionPlugin('omemo', omemo);
pprint("done")
