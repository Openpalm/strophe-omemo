"use strict";

var codec= require('./codec.js')
var gcm = {};


function pprint(s) {
    console.log("gcm.js: " + s)
}

// AES GCM

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
                return this.serializeKey(key).then(key_str => {
                    libsignalPayload = key_str
                    let gcm_out = {
                        key: key,
                        cipherText: cipherText,
                        iv: temp_iv,
                        tag: this.gettag(cipherText, 128)
                    }
                    //OMMSG: omemo msg
                    //LSPLD: Libsignal payload
                    let enforced64 = codec.enforceBase64ForSending(gcm_out)
                    let out = {OMMSG: gcm_out, LSPLD: libsignalPayload, TAG: gcm_out.tag, ORIGSTR: text, BASE64: enforced64}
                    return Promise.resolve(out)
                })
            })

        })
    },
    decrypt: function (key, cipherText, iv) {
       // console.log("in decrypt")
       // console.log(key)
       // console.log(cipherText)
       // console.log(iv)
        return this.restoreKey(key).then(keyObj => {
            let enc = new TextDecoder()
            let out = ''
            return window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                    tagLength: 128,
                },
                keyObj,
                cipherText
            )
                .then((decrypt_out) =>  {
                    let decoder = new TextDecoder()
                    return decoder.decode(decrypt_out)
                })
        })
    },
    serializeKey: function (CryptoKeyObject) {
        let res = ''
        return window.crypto.subtle.exportKey("jwk", CryptoKeyObject)
            .then((e) => {
                return e.k
            })
    },

    restoreKey:  function (k) {
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
    },
    gettag:  function (encrypted, tagLength) {
        if (tagLength === void 0) tagLength = 128;
        return encrypted.slice(encrypted.byteLength - ((tagLength + 7) >> 3))
    },

    getKeyAndTag: function(string) {
        return {
            key: string.slice(0, 43), //256bit key
            tag: string.slice(43, string.length) //rest is tag
        }
    }
}


module.exports = gcm
