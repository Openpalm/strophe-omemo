"use strict";
var codec = {};

codec = {
  StringToUint8: function (string) {
    var enc = new TextEncoder("utf-8");
    return enc.encode(string);
  },
  BufferToString: function (buffer) {
    var enc = new TextEncoder();
    return enc.encode(buffer);
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
  },
  StringToBase64: "TODO",
  Base64ToString: "TODO"
}

module.exports = codec
window.codec = codec
