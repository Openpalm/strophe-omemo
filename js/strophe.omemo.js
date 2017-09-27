//import { $iq, Strophe } from './strophe.js';
import SignalProtocolStore from './libs/libsignaljs/test/InMemorySignalProtocolStore.js' //probably init in browser.html and pass it on.
import $ from 'jquery'
import 'crypto' from 'crypto'

Strophe.addNamespace('OMEMO', 'eu.siacs.conversations.axolotl');

var omemo = {
  _connection: null,
  _storage: window.localStorage
  _bundle: null // safe here?
  _cipher: null // pass in gcm function. (window.crypto or window.msCrypto)
};


omemo.init = function(conn) {
  this._connection = conn;
  //@TODO maybe setup
  conn.addHandler(this._onMessage.bind(this), null, 'message');
}
omemo.restore = function(file) {
  //  takes in an encrypted file that contains session information
  //  restores a session for a user
}
omemo.serialize = function(file) {
  // serialize the current session into a restorable format 
}
omemo.IV = function(IV) {
  //set the IV
}
omemo.messageKey = function(messageKey) {
  //set the messageKey
}
omemo.setUpMessageElements = function(text) {
  //set the message elements
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

Strophe.addConnectionPlugin('omemo', omemo);

