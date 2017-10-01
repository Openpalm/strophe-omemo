"use strict";

var codec= require('./codec.js')
var gcm = {};

gcm =  {
  encrypt: function (text, miv, mkey, mad) {
    window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: miv,
        additionalData: mad,
        tagLength: 128
      },
      key = mkey,
      codec.s(text)
    )
      .then(function(encrypted){
        //see if ley generation works instead of using the in built function.
        return new Uint8Array(encrypted);
      })
      .catch(function(err){
        console.error(err);
      });
  },
  decrypt: function(ciphertext, miv, mkey, mad) {
    window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: miv, //uint8 buffer
        additionalData: mad, //uint8 buffer
        tagLength: 128
      },
      mkey,
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
  key: 
  function () {

    var keyingMaterial = window.crypto.getRandomValues(new Uint8Array(32))
    var hexForm = codec.Uint8ToHexString(keyingMaterial)
    console.log(hexForm)

    window.crypto.subtle.importKey(
      "jwk", //can be "jwk" or "raw"
      {   
        kty: "oct",
       // k: "Y0zt37HgOx-BY7SQjYVmrqhPkO44Ii2Jcb9yydUDPfE", 
        k: "Y0zt37HgOx-BY7SQjYVmrqhPkO44Ii2Jcb9yydUDPfE", 
        alg: "A256GCM",
        ext: true,
      },
      {   name: "AES-GCM", },
      false,
      ["encrypt", "decrypt"])
      .then(function(key){ console.log(key);})
      .catch(function(err){ console.error(err);})
  },
  aad: function(jid1, jid2) {
    return "two concatinated identity key encodes here"
  }
}

module.exports = gcm
window.gcm = gcm


//var key = gcm.key()
//var iv = gcm.iv()
//var text = "some text"
//var res = gcm.encrypt(text, iv, key, gcm.assData)
//window.res = res

