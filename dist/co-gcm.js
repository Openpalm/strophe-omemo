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


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var codec = {};

codec = {
  b64encode: function (buffer) {
    let binary = ''
    let bytes = new Uint8Array(buffer)
    let len = bytes.byteLength
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  },
  b64encodeToBuffer: function (base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length
    var bytes = new Uint8Array( len )
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
  },
  StringToUint8: function (string) {
    let enc = new TextEncoder("utf-8")
    return enc.encode(string)
  },
  BufferToString: function (buffer) {
    let enc = new TextEncoder()
    return enc.encode(buffer)
  },
  Uint8ToString: function (buffer) {
    return String.fromCharCode.apply(null, buffer);
  },
  Uint8ToHexString: function (buffer) {
    //use window.crypto.subtle.digest here (??) XEP spec. is 64 encode though. double check.
    var res = ''
    for (var i = 0; i <  buffer.length; i++) {
      res = res + buffer[i].toString(8)
    }
    return res
  }
}

module.exports = codec
window.codec = codec


/***/ })
/******/ ]);