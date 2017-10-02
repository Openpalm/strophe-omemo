"use strict";

var codec= require('./codec.js')
var gcm = {};

gcm =  {
  encrypt: function (text, miv, mkey, aad) {
    window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: miv,
        additionalData: aad,
        tagLength: 128
      },
      mkey,
      codec.StringToUint8(text)
    )
      .then(function(encrypted){
        //see if ley generation works instead of using the in built function.
        return new Uint8Array(encrypted);
      })
      .catch(function(err){
        console.error(err);
      });
  },
  decrypt: function(ciphertext, miv, mkey, aad) {
    window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: miv, //uint8 buffer
        additionalData: aad, //uint8 buffer
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
  key: function () {

    window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, //can be  128, 192, or 256
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
    )
      .then(function(key){
        //key must be extracted here 
        window.crypto.subtle.exportKey(
          "jwk", //can be "jwk" or "raw"
          key //extractable must be true
        )
          .then(function(keydata){
            //returns the exported key data
            //console.log(keydata)
            //console.log(keydata.k)
            return keydata
          })
          .catch(function(err){
            console.error(err);
          });
      })
      .catch(function(err){
        console.error(err);
      })
  } ,
  //function () {

  //  var km  = window.crypto.getRandomValues(new Uint8Array(32))
  //  window.km = km
  //  var bufferForm = km.buffer // this is empty.
  //  console.log(bufferForm)
  //  var hexForm = codec.Uint8ToHexString(km)

  //  window.crypto.subtle.importKey(
  //    "raw", //can be "jwk" or "raw"
  //    bufferForm 
  //    ,
  //    { name: "AES-GCM", },
  //    true,
  //    ["encrypt", "decrypt"])
  //    .then(function(key){ console.log(key);})
  //    .catch(function(err){ console.error(err);})
  //},
  aad: function(jid1, jid2) {
    return "two concatinated identity key encodes here"
  }
}

module.exports = gcm
window.gcm = gcm


//var key = gcm.key()
//var iv = gcm.iv()
//var text = "some text"
//var res = gcm.encrypt(text, iv, key, gcm.mad)
//window.res = res

