/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var codec= __webpack_require__(1)
var gcm = {};


function pprint(s) {
  console.log("gcm.js: " + s)
}
function serializeKey(CryptoKeyObject) {
  let res = ''
  return window.crypto.subtle.exportKey("jwk", CryptoKeyObject)
    .then((e) => {
      return codec.StringToBase64(e.k)
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
  const aad =  codec.StringToUint8("fetch from libsignal rid store here")
  const alg = {
    name: "AES-GCM",
    iv: temp_iv, //uint8 buffer
    additionalData: aad, //uint8 buffer
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
        aad: aad,
        tag: gettag(cipherText, 128)
      }
      //OMMSG: omemo msg
      //LSPLD: Libsignal payload
      let out = {OMMSG: gcm_out, LSPLD: libsignalPayload, ORIGSTR: text}
      return Promise.resolve(out)
    })
  })
}

function decrypt(key, cipherText, iv, aad) {
  let enc = new TextDecoder()
  let out = ''
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
  decrypt: function (key, cipherText, iv, aad) {
    return restoreKey(key).then(res => {
      return decrypt(res, cipherText,iv, aad).then(decrypt_out => {
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
  }
}
module.exports = gcm


/***/ }),
/* 1 */
/***/ (function(module, exports) {

throw new Error("Module parse failed: /var/www/strophe-omemo/js/codec.js Unexpected token (45:2)\nYou may need an appropriate loader to handle this file type.\n|     return Base64.encode(string)\n|   }\n|   Base64ToString: function (base64string) {\n|     return Base64.decode(base64string)\n|   }");

/***/ })
/******/ ]);