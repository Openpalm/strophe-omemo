"use strict";

var codec= require('./codec.js')
var gcm = {};

gcm =  {
  encrypt: function (text, iv, key, assData) {
    var gcmMaterial = omemo.prepareGcm()
    window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        additionalData: omemo.stringToBuffer(gcmMaterial[1]),
        tagLength: 128,
      },
      key = gcmMaterial[2],
      codec.StringToUin8(text)
    )
      .then(function(encrypted){
        //see if ley generation works instead of using the in built function.
        return new Uint8Array(encrypted);
      })
      .catch(function(err){
        console.error(err);
      });
  },
  decrypt: function(key, iv, aad, ciphertext) {
    window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv, //uint8 buffer
        additionalData: aad, //uint8 buffer
        tagLength: 128, 
      },
      key,
      ciphertext //ArrayBuffer of the data
    )
      .then(function(decrypted){
        //if success, destroy receive key before returning
        //returns an ArrayBuffer containing the decrypted data
        return new Uint8Array(decrypted);
      })
      .catch(function(err){
        console.error(err);
      });
  },
  iv:  function () {
    return window.crypto.getRandomValues(new Uint8Array(12))
  },
  key: function () { 
    return window.crypto.getRandomValues(new Uint8Array(32))
  },
  assData: function(jid1, jid2) {
    return "two concatinated identity key encodes here"
  }
}
