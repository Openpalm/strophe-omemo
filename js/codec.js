"use strict";
var codec = {};

codec = {
  StringToUint8: function (string) {
    var enc = new TextEncoder("utf-8");
    return enc.encode(string);
  },
  Uint8ToString: function (buffer) {
    return String.fromCharCode.apply(null, buffer);
  },
  Uint8ToHexString: function (buffer) {
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
