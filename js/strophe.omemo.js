"use strict";

var $ = require('jquery');
var codec = require('./codec.js')
var gcm = require('./gcm.js')

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

var minDeviceId = 1
var maxDeviceId = 2147483647

var omemo = {
  _connection: null,
  _store: null,
  _bundle: null, // safe here? yes. needs to be populated. // handle in store
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
  console.log("initializing")
  omemo.setLibsignal(libsignal)
  omemo.setStore(store)
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
omemo.addNewDevice = function () {
  let diff = (maxDeviceId - minDeviceId)
  return Math.floor (
  Math.random() * diff  + minDeviceId)
  //attempt to publish here. or handle in a omemo.publish function.
  //that publishes to pep and handles collisions.
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
  consolo.log("setting route to libsignal-protocol.js ...")
  omemo._libsignal  = ep
  consolo.log("setting KeyHelper ... ")
  omemo._keyhelper  = ep.KeyHelper
  console.log("library loaded, store set.")
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
  console.log("arming libsignal ... ")
if (omemo._store == null) {
  //attempt to restore from a database on disk using JSON.parse.
  //store using JSON.stringify(omemo._store) before throwing the Error
  throw new Error("no store set, terminating.")
  }

  var KeyHelper = omemo._keyhelper

  Promise.all([
    KeyHelper.generateIdentityKeyPair(),
    KeyHelper.generateRegistrationId(),
  ]).then(function(result) {
    var identity = result[0];
    var registrationId = result[1];

    store.put('identityKey', result[0]);
    store.put('registrationId', result[1]);
    console.log("registration id: "+ result[1] +
      "\nidentity Key generated and stored.\n ")
  })


}
/**
 * generatePreKeys
 * generates a 100 preKeys, stores in store.
 * creates a preKeyPubRecord of keys for PEP
 *
 * @returns {true} on success, Error on failure
 */
omemo.generatePreKeys = function() {
    return Promise.all([
        store.getIdentityKeyPair(),
        store.getLocalRegistrationId()
    ]).then(function(result) {
        var identity = result[0];
        var registrationId = result[1];

        return Promise.all([
            KeyHelper.generatePreKey(preKeyId),
            KeyHelper.generateSignedPreKey(identity, signedPreKeyId),
        ]).then(function(keys) {
            var preKey = keys[0]
            var signedPreKey = keys[1];

            store.storePreKey(preKeyId, preKey.keyPair);
            store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

            return {
                identityKey: identity.pubKey,
                registrationId : registrationId,
                preKey:  {
                    keyId     : preKeyId,
                    publicKey : preKey.keyPair.pubKey
                },
                signedPreKey: {
                    keyId     : signedPreKeyId,
                    publicKey : signedPreKey.keyPair.pubKey,
                    signature : signedPreKey.signature
                }
            };
        });
    });
}
/**
 * setUpMessageElements
 * handles XMPP syntax packing on query Omemo message types.
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
 * restore
 *
 * attempts to restore a session from a saved JSON object
 * populates a fresh libSignalStore with content. assumes 
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
  // serialize the current session into a restorable format
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

module.exports = omemo
window.omemo = omemo

pprint("registering with Strophe")
Strophe.addConnectionPlugin('omemo', omemo);
pprint("done")
