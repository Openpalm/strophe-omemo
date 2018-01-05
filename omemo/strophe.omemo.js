let codec = require('./codec.js')
let gcm = require('./gcm.js')


let omemo_timing_helpers = function () { 
	//testing, thesis.

}

let omemo_user = { // gets added to user roster
	trusted: false,
	bundle: null, //omemoBundle
}

let omemo_helpers = function () {
	generate_preKeys: function () {},
	refresh_preKeys: function () {},
	refresh_signedKey: function () {},
	construct_bundle_stanza: function () {},
 	construct_encrypted_stanza: function () {}, 
	if_first_use: function () {}
}

Strophe.addConnectionPlugin('omemo', {
	init: function (connection) {
		this.connection = connection;
		omemo_helpers.if_first_use(); //arm if first use. looks in window.Storage.
	},
	on_bundle: function (xml_stanza) {},
	on_message: function (xml_stanza) {},
	on_device: function (xml_stanza) {},
	fetch_bundle: function (device_id) {},
	refresh_bundle: function () {},
	announce_bundle: function () {}
});
