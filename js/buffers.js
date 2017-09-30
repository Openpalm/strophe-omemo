var encoder = {};

encoder = {
  StringtoUint8: function (string) {
    var enc = new TextEncoder("utf-8");
    return enc.encode(string);
  },
  BuffertoString: function (buffer) {
    return String.fromCharCode.apply(null, buffer);
  }
}
