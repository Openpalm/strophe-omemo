let codec = require('./codec.js')
let symCipher = require('./gcm.js')
//let symCipher = require('./EAX.js')
//let symCipher = require('./xChaCha20.js')

let omemo_timing_helpers =  {
	//testing, thesis.
    //jsperf stuff

}

//let encrypted = gcm.encrypt("blah").then(e => { console.log(e)})

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

        Strophe.addNamespace('OMEMO',         
            'eu.siacs.conversations.axolotl')
        Strophe.addNamespace('OMEMO_BUNDLES', 
            'eu.siacs.conversations.axolotl.bundles')
        Strophe.addNamespace('OMEMO_DEVICELIST', 
            'eu.siacs.conversations.axolotl.devicelist')
        Strophe.addNamespace('OMEMO_DEVICELIST_NOTIFY', 
            'eu.siacs.conversations.axolotl.devicelist+notify')

		this.if_first_use(); //arm if first use. looks in window.Storage.

        //Strophe.addHandler(func,ns,type,name(iq, message, etc), id)

        Strophe.addHandler(this.on_devicelist,
           Strophe.NS.OMEMO_DEVICELIST,
           "headline",
           "message", 
           "update_01") // devicelist update

        Strophe.addHandler(this.on_devicelist,
           Strophe.NS.OMEMO,
           "headline",
           "message", 
           "update_01") // message 



	},
	on_bundle: function (xml_stanza) {
    
        console.log("omemo bundle was received")
    },
	on_message: function (xml_stanza) {
    
        console.log("omemo message update was received")
    },
	on_device: function (xml_stanza) {
    
        console.log("omemo device list update was received")
    },
	fetch_bundle: function (device_id) {
        console.log("omemo device list update was received")
    },
	refresh_bundle: function () {
        console.log("omemo refreshing bundle")
    },
	announce_bundle: function () {
        console.log("omemo announcing bundle")
    },

    if_first_use: function () {
        console.log("omemo first use")
    
    },

});

