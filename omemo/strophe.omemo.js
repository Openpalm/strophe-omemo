let codec = require('./codec.js')
let gcm = require('./gcm.js')

let omemo_timing_helpers =  {
	//testing, thesis.
    //jsperf stuff

}

let encrypted = gcm.encrypt("blah").then(e => { console.log(e)})

let omemo_user = { // gets added to user roster
	trusted: false,
	bundle: null, //omemoBundle
}

let omemo_helpers = {
	generate_preKeys: function () {
        console.log("hello") },
	refresh_preKeys: function () {},
	refresh_signedKey: function () {},
	construct_bundle_stanza: function () {},
 	onstruct_encrypted_stanza: function () {},
	if_first_use: function () {}
}

Strophe.addConnectionPlugin('omemo', {
	init: function (conn) {
		this.connection = conn;

        Strophe.addNamespace('OMEMO',         'eu.siacs.conversations.axolotl')
        Strophe.addNamespace('OMEMO_BUNDLES', 'eu.siacs.conversations.axolotl.bundles')
        Strophe.addNamespace('OMEMO_DEVICES', 'eu.siacs.conversations.axolotl.devices')

		this.if_first_use(); //arm if first use. looks in window.Storage.

	},
	on_bundle: function (xml_stanza) {},
	on_message: function (xml_stanza) {},
	on_device: function (xml_stanza) {},
	fetch_bundle: function (device_id) {},
	refresh_bundle: function () {},
    if_first_use: function () {},
	announce_bundle: function () {}

});

