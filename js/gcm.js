"use strict";

var codec= require('./codec.js')
var gcm = {};

function pprint(s) {
  console.log("gcm.js: " + s)
}
gcm =  {
  encrypt: 
     function (text) {
      let temp_iv = window.crypto.getRandomValues(new Uint8Array(12))
      let aad =  codec.StringToUint8("fetch from libsignal rid store here")

      window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, //max key length, min is 128
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ["encrypt", "decrypt"] //can "encrypt" and "decrypt"
    )
         .then((key){

           window.crypto.subtle.encrypt(
             {
               name: "AES-GCM",
               iv: temp_iv,
               additionalData: aad,
               tagLength: 128
             },
             key,
             codec.StringToUint8(text)
           )
             .then((ctext, tag) => {  return [
                 ctext,
                 tag,
                 iv,
                 key
               ] 
             })
         })
     },

 
  decrypt: function(ciphertext, miv, mkey, aad) {
    window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: miv, //uint8 buffer
        additionalData: aad, //uint8 buffer
        tagLength: 128
      },
      mkey, //CryptoKey
      ciphertext //Uint8 of the data
    )
      .then(function(decrypted){
        //if success, destroy receive key before returning
        //returns an ArrayBuffer containing the decrypted data
        //window.decrypted = decrypted
        return new Uint8Array(decrypted);
      })
      //.catch(function(err){ // err ironically hides the real error.
      //  console.error(err); // good for err handeling, not debugging.
      //});
  },
  iv:  function () {
    return window.crypto.getRandomValues(new Uint8Array(12))
  },
  key: function () {
    window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, //max key length, min is 128
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ["encrypt", "decrypt"] //can "encrypt" and "decrypt"
    )
      .then(function(key){
        //key must be extracted here 
        window.crypto.subtle.exportKey(
          "jwk", //can be "jwk" or "raw"
          key //extractable must be true
        )
          .then(function(keydata){
            //returns the exported key data
            window.key = key
            window.keydata = keydata
            [key, keydata]

          })
          .catch(function(err){
            console.error(err.message);
          });
      })
      .catch(function(err){
        console.error(err.message);
      })
  } ,
}

module.exports = gcm
window.gcm = gcm

//gcm.key()
//gcm.encrypt("hello", gcm.iv(), key, gcm.aad())
