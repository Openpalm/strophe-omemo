"use strict";

var $ = require('jquery');
//var codec = require('./codec.js')
var gcm = require('./gcm.js')
var store = require('./store.js')

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

pprint(iq)

var omemo = {
  _connection: null,
  _storage: window.localStorage,
  _bundle: null, // safe here?
  _cipher: null, // pass in gcm function. (window.crypto or window.msCrypto)
  _gcm: null, //window.crypto.subtle.encrypt()
  _libsignal: null,
  _AD: null, //association data
  _deviceid: null
}

var omemo  = {

}
omemo.init = function(conn) {
  this._connection = conn; //strophe conn
  //@TODO maybe setup
  //restore session?
  //create new session?
  //generates or retrieves bundle.
  //publishes or adds device to bundle
  conn.addHandler(this._onMessage.bind(this), null, 'message');
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

pprint("registering with Strophe")
Strophe.addConnectionPlugin('omemo', omemo);
pprint("done")
