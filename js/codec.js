"use strict";
var encoder = {};

encoder = {
  StringtoUint8: function (string) {
    var enc = new TextEncoder("utf-8");
    return enc.encode(string);
  },
  Uint8ToString: function (buffer) {
    return String.fromCharCode.apply(null, buffer);
  },
  StringToBase64: "implementation error: TODO",
  Base64ToString: "implementation error: TODO"
}
