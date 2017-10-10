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
  }
}

module.exports = codec
window.codec = codec
