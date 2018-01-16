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

        //Strophe.addHandler(func,ns,type,name(iq, message, etc), id)



        /* 
         * devicelist 
         *
         * will not work till pubsub is integrated 
         * temp solution is manual polling till uni work is done
         */
        //        conn.addHandler(
        //            this.on_devicelist,
        //            Strophe.NS.OMEMO_DEVICELIST,
        //            "headline",
        //            "message", 
        //            "update_01") 
        //        /* 
        //         * message 
        //         *
        //         * the ns @ <publish> has a :id attached to it, 
        //         * matching won't work, so we match on the top NS @ <bundle>.
        //         * 
        //        */
        this.connection.addHandler(
            this.on_message,
            Strophe.NS.OMEMO,
            "message", 
            null)
        //
        //        /* 
        //         * bundle
        //         *
        //         * xmpp is a bit inconsistent with changing stanza parameters. 
        //         * message is static.
        //         * while bundle switches to result
        //         * suppose they're different internal opertions on the server layer
        //        */
        //        conn.addHandler(
        //            this.on_bundle,
        //            //Strophe.NS.OMEMO, 
        //            null,
        //            "result",
        //            "iq", 
        //            "fetch1")
        //

            },
    setup: function (jid) {
        if (!localStorage.getItem(jid)) {
            var id = this.new_id()
            console.log(id)
            localStorage.setItem(jid, id)
       }
        this._jid = jid
        this._id = id
        try { 
            if (libsignal) {
                console.log("loaded") 
            } 
        } catch(e) { 
            throw new Error ("Libsignal-Protocol not found")
        }
        try { 
            if (SignalProtocolStore) {
                this.connection._signal_store = new SignalProtocolStore(jid, id)
            } 
        } catch(e) { 
            throw new Error ("SignalProtocolStore not found")
        }
        try { 
            if (OmemoStore) {
                this.connection._omemo_store = new SignalProtocolStore(jid, id)
            } 
        } catch(e) { 
            throw new Error ("SignalProtocolStore not found")
        }
        return Promise.all([this.arm()]).then(e => {
            console.log("armed") 
        })
    },
    arm: function () {
        console.log("omemo first use")
        if (this.connection._signal_store == null) {
            throw new Error("no store set, terminating.")
        }
        var ctxt = this
        let kh  = libsignal.KeyHelper
        let registrationId = ''
        Promise.all([
            kh.generateIdentityKeyPair(),
            ctxt.genPreKeys(100)
        ]).then(function(result) {
            let identity = result[0];
            registrationId = ctxt._id
            console.debug(ctxt.connection)
            ctxt.connection._signal_store.put('registrationId', registrationId)
            ctxt.connection._signal_store.put('identityKey', result[0])
            //double work refactor later
            ctxt.connection._signal_store.getIdentityKeyPair().then((ikey) =>
                kh.generateSignedPreKey(ikey, 1)).then((skey) => {
                    let key = {
                        pubKey: skey.keyPair.pubKey,
                        privKey: skey.keyPair.privKey,
                        keyId: skey.keyId,
                        signature: skey.signature
                    }
                    ctxt.connection._signal_store.storeSignedPreKey(1, key)
                })
            ctxt._address = new libsignal.SignalProtocolAddress(ctxt._jid, ctxt.connection._signal_store.get('registrationId'));
        }).then( o => { 
            ctxt.connection._signal_store.setLocalStore(ctxt._jid, ctxt._id)
            console.log("omemo is ready.")
        })
        console.log(ctxt.connection._signal_store)
    },
    on_bundle: function (xml_stanza) {

        console.log("omemo bundle was received")
        return true
    },
    on_message: function (xml_stanza) {

        console.log("omemo message update was received")
        return true
    },
    on_device: function (xml_stanza) {

        console.log("omemo device list update was received")
        return true
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
    genPreKeys: function(range) {
        let ctxt = this
        let kh = libsignal.KeyHelper
        let promises = []
        for (let i = 1; i < range + 1; i++ ) {
            promises.push(kh.generatePreKey(i).then((k) =>  {
                let key = {
                    pubKey: k.keyPair.pubKey, 
                    privKey: k.keyPair.privKey, 
                    keyId: k.keyId
                }
               ctxt.connection._signal_store.storePreKey(i,key)
            }))
        }
        return Promise.all(promises).then(console.log("preKeys phase complete"))
    },
    new_id: function () {
        let minDeviceId = 1
        let maxDeviceId = 2147483647
        let diff = (maxDeviceId - minDeviceId)
        let res = Math.floor(Math.random() * diff  + minDeviceId)
        this._id = res
        return res
    },
    publish_device: function () {
        var ctxt = this
        //initial add. all other additions happen on receiving device updates.
        let res = $iq({type: 'set', from: ctxt._jid, id: 'anounce1'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
            .c('publish', {node: Strophe.NS.OMEMO_DEVICES})
            .c('item')
            .c('list', {xmlns: Strophe.NS.OMEMO})
            .c('device', {id: ctxt._id  }).up()
        return res

    },
    publish_bundle: function() {
    },

});

