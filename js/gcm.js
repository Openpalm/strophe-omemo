"use strict";

var codec= require('./codec.js')
var gcm = {};


function pprint(s) {
  console.log("gcm.js: " + s)
}
function serializeKey(CryptoKeyObject) {
  let res = ''
  return window.crypto.subtle.exportKey("jwk", CryptoKeyObject)
    .then((e) => {
      return e.k
    })
}
function restoreKey(k) {
  let CryptoKeyObject = {
    "alg": "A256GCM",
    "ext": true,
    "k": k,
    "key_ops": ["encrypt","decrypt"],
    "kty": "oct"
  }
  return crypto.subtle.importKey('jwk', CryptoKeyObject, 'AES-GCM', true, ['encrypt','decrypt'])
    .then((e) => {
      return e
    })
}
function gettag(encrypted, tagLength) {
  if (tagLength === void 0) tagLength = 128;
  return encrypted.slice(encrypted.byteLength - ((tagLength + 7) >> 3))
}
function encrypt(key, text) {
  //the out of window.crypto is only the cipher text (i assume?)
  //the tag is not mentioned. unless it concatinated inside. look at code?
  //after ecnrypting, we dont need to keep the key
  const data = codec.StringToUint8(text)
  const temp_iv = window.crypto.getRandomValues(new Uint8Array(16))
  const alg = {
    name: "AES-GCM",
    iv: temp_iv, //uint8 buffer
    tagLength: 128
  }
  return window.crypto.subtle.encrypt(alg, key, data).then((cipherText) => {
    let out = ''
    let libsignalPayload = ''
    return serializeKey(key).then(res => {
      libsignalPayload = res
      let gcm_out = {
        key: key,
        cipherText: cipherText,
        iv: temp_iv,
        tag: gettag(cipherText, 128)
      }
      //OMMSG: omemo msg
      //LSPLD: Libsignal payload
      let out = {OMMSG: gcm_out, LSPLD: libsignalPayload, ORIGSTR: text}
      return Promise.resolve(out)
    })
  })
}

function decrypt(key, cipherText, iv) {
  let enc = new TextDecoder()
  let out = ''
  return window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128,
    },
    key,
    cipherText
  )
    .then((gcm_out) =>  {
      return gcm_out
    })
}
gcm = {
  encrypt: function (text) {
    return window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256, //current max value
      },
      true, //extractable yes
      ["encrypt", "decrypt"] //can "encrypt", "decrypt",
    ).then((key) => {
      return encrypt(key, text)
    })
  },
  decrypt: function (key, cipherText, iv) {
    return restoreKey(key).then(res => {
      return decrypt(res, cipherText,iv).then(decrypt_out => {
        let decoder = new TextDecoder()
        return decoder.decode(decrypt_out)
      })
    })
    //return decoder.decode(res)
    //on success destroy key ? or set timer for key destruction?
  },
  serializeKey: function(key) {
    return serializeKey(key)
  },
  restoreKey: function(key) {
    return restoreKey(key)
  },
  getKeyAndAADFromLibSignalDecrypt: function(string) {
    return {
      key: string.slice(0, 43), //256bit key
      tag: string.slice(43, string.length) //rest is tag
    }
  }
}
module.exports = gcm
