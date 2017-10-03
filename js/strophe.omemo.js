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
  _storage: null,
  _bundle: null, // safe here? yes. needs to be populated.
  _libsignal: null, //probably not needed.
  _keyHelper: null,
  _deviceid: null
}

omemo.init = function(conn) {
  this._connection = conn; //strophe conn
  console.log("to be implemented")
  //@TODO maybe setup
  //restore session?
  //create new session?
  //generates or retrieves bundle.
  //publishes or adds device to bundle
  //conn.addHandler(this._onMessage.bind(this), null, 'message'); // ? strophe conn?
}

omemo.addNewDevice = function () {
  return Math.random() * (maxDeviceId - minDeviceId)  + minDeviceId
}
omemo.setStore = function (store) {
  omemo._store = store
}
omemo.initLibSignal = function() {
if (omemo._store == null) { 
  throw new Error("no store set, terminating.")
  } 
  var keyHelper = omemo._libsignal.KeyHelper
  Promise.all([
    KeyHelper.generateIdentityKeyPair(),
    KeyHelper.generateRegistrationId(),
  ]).then(function(result) {
    store.put('identityKey', result[0]);
    store.put('registrationId', result[1]);
  })
}
omemo.setUpMessageElements = function(type, text) {
  //set the message elements
  //handles type of message 
  //1. preKeySignalMessage
  //2. signalMessage
  //3. presense of <payload>
}
omemo.restore = function(file) {
  //  takes in an encrypted file that contains session information
  //  restores a session for a user
}
omemo.serialize = function(file) {
  // serialize the current session into a restorable format 
}
omemo.createEncryptedStanza = function(to, plaintext) {
  var encryptedStanza = new Strophe.Builder('encrypted', {
    xmlns: Strophe.NS.OMEMO
  });

  //@TODO

  return encryptedStanza;
}
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
