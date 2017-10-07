"use strict";

var codec= require('./codec.js')
var gcm = {};


function pprint(s) {
  console.log("gcm.js: " + s)
}
function encrypt(key, text) {
  //the out of window.crypto is only the cipher text (i assume?)
  //the tag is not mentioned. unless it concatinated inside. look at code?
  //after ecnrypting, we dont need to keep the key
  const data = codec.StringToUint8(text)
  const temp_iv = window.crypto.getRandomValues(new Uint8Array(16))
  const aad =  codec.StringToUint8("fetch from libsignal rid store here")
  const alg = {
    name: "AES-GCM",
    iv: temp_iv, //uint8 buffer
    additionalData: aad, //uint8 buffer
    tagLength: 128
  }
  window.crypto.subtle.encrypt(alg, key, data).then((cipherText) => { 
    let gcm_out = {
      key: key,
      ct: cipherText, 
      iv: temp_iv,
      aad: aad
    } 
    omemo._store.put("encrypted", gcm_out) 
  })
  return Promise.resolve(true)
}

function decrypt(key, cipherText, iv, aad) {
  let enc = new TextDecoder()
  return window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv, 
      additionalData: aad, 
      tagLength: 128, 
    },
    key,
    cipherText
  )
    .then((gcm_out) =>  {
      omemo._store.put("decrypted", gcm_out)
      console.log(enc.decode(store.get("decrypted")))
    })
  return Promise.resolve(true)
}

gcm = {
  encrypt: function (text) {
    window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, //current max value
      },
      true, //extractable yes
      ["encrypt", "decrypt"] //can "encrypt", "decrypt",
    ).then((key) => {encrypt(key, text)})
  },
  decrypt: function (key, cipherText, iv, aad) {
    decrypt(key, cipherText,iv, aad)
    //on success destroy key ? or set timer for key destruction?
  }
}

module.exports = gcm
window.gcm = gcm

//gcm.key()
//gcm.encrypt("hello", gcm.iv(), key, gcm.aad())