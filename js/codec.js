"use strict";

let base64 = require('./base64.js')
var codec = {};

codec = {
  b64encode: function (buffer) {
    let binary = ''
    let bytes = new Uint8Array(buffer)
    let len = bytes.byteLength
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  },
  b64ToBuffer: function (base64) {
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
    let enc = new TextDecoder()
    return enc.encode(buffer)
  },
  StringToBuffer: function (string) {
   return Buffer.from(string, 'utf8')
  },
  Uint8ToString: function (buffer) {
    return String.fromCharCode.apply(null, buffer)
  },
  type: function (obj){
    return Object.prototype.toString.call(obj).slice(8, -1);
  },
  StringToBase64: function (string) {
    return Base64.encode(string)
  },
  Base64ToString: function (base64string) {
    return Base64.decode(base64string)
  }
}

module.exports = codec
