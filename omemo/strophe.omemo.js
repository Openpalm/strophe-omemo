let codec = require('./codec.js')
let symCipher = require('./gcm.js')
let $ = require('jquery')


//let symCipher = require('./EAX.js')
//let symCipher = require('./xChaCha20.js')

Strophe.addConnectionPlugin('omemo', {
    init: function (conn) {
        this.connection = conn;

        Strophe.addNamespace('OMEMO',         
            'eu.siacs.conversations.axolotl')
        Strophe.addNamespace('OMEMO_BUNDLES', 
            'eu.siacs.conversations.axolotl.bundles')
        Strophe.addNamespace('OMEMO_DEVICELIST', 
            'eu.siacs.conversations.axolotl.devicelist')

        this.publish = this.connection.pep.publish
        this.subscribe = this.connection.pep.subscribe

    },
    setup: function (jid) {
        let ctxt = this
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
            //bundle && device headline handler
            ctxt.connection.addHandler(
                ctxt.on_headline,
                null,
                "message",
                "headline")
            ctxt.connection.addHandler(
                ctxt.on_bundle,
                null,
                "iq",
                "result",
                "fetch1"
            )

            ctxt.connection.pep.subscribe(Strophe.NS.OMEMO_DEVICELIST)
            ctxt.publish_device()
        })
    },
    arm: function () {
        console.log("omemo first use")
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
                    ctxt.publish_bundle()
                })
            ctxt._address = new libsignal.SignalProtocolAddress(ctxt._jid, ctxt.connection._signal_store.get('registrationId'));
        }).then( o => { 
            ctxt.connection._signal_store.setLocalStore(ctxt._jid, ctxt._id)
            console.log("omemo is ready.")
        })
    },
    on_bundle: function (stanza) {
        console.log("omemo bundle was received")
        /////////////////
        let sk, sk_id, signature, ik, from_id, from , _key, pkey, pkey_id
        let pkeys = [] 

        $(stanza).find('items').each(function () {
            from_id = parseInt($(this).attr('node').split(":")[1])
            console.log(from_id)
        })
        $(stanza).find('iq').each(function () {
            from = $(this).attr('from')
            console.log(from)
        })
        $(stanza).find('signedPreKeyPublic').each(function () {
            sk_id = parseInt($(this).attr('signedPreKeyId'))
            sk = codec.Base64ToBuffer($(this).text())
            console.log("signedKey")
            console.log(sk)
            console.log(sk_id)
        })
        $(stanza).find('signedPreKeySignature').each(function () {
            signature = codec.Base64ToBuffer($(this).text())
            console.log("signature")
            console.log(signature)
        })
        console.log("trying to find prekeys")
        $(stanza).find('preKeyPub').each(function () {
            console.log("found pkey")
            pkey = codec.Base64ToBuffer($(this).text())
            pkey_id  = $(this).attr('keyId')
            _key = {id: pkey_id, key: pkey}
            console.log(key_)
          //  pkeys.put(key)
          //  console.log(pkeys)
        })

       console.log("trying to find id key")
       ik =  $(stanza).find('identityKey')           // codec.Base64ToBuffer($(this).text())
       console.log("identityKey")
       console.log(ik)
        ////////////////
        let public_bundle =  {
            registrationId: from_id,
            identityKey: ik,
            signedPreKey: {
                keyId     : sk_id,
                publicKey : sk,
                signature : signature
            },
            //preKey: {
            //    keyId     : keyId,
            //    publicKey : preKey.pubKey
            //}
        }

        let res = { jid: from, public_bundle:  public_bundle }
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
    on_headline: function (stanza) {
        let moo =   $(parsed).find('list')

        console.log(moo)

        //      .each(function () {

        //  })

        return true 
    },
    is_deviceHeadline: function (stanza)  {

        let parsed = $.parseXML(XML)

        return false
    },
    is_bundleHeadline: function (stanza) {

        return false
    },
    fetch_bundle: function (to, device) {
        let ctxt = this
        let res = $iq({type: 'get', from: ctxt._jid, to: to, id: 'fetch1'})
            .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
            .c('items', {node: Strophe.NS.OMEMO_BUNDLES + ":" + device}) 
        this.connection.send(res)
    },
    refresh_bundle: function () {

        console.log("omemo refreshing bundle")
    },
    publish_bundle: function () {
        console.log("omemo announcing bundle")
        let ctxt= this
        let sk_id = 1

        let promises = [
            this.connection._signal_store.loadSignedPreKey(sk_id),
            this.connection._signal_store.getIdentityKeyPair(),
            this.connection._signal_store.loadSignedPreKeySignature(sk_id),
            this.connection._signal_store.getLocalRegistrationId()
        ]
        return Promise.all(promises).then(o => {
            let sk = o[0]
            let ikp = o[1]
            let signature = o[2]
            let rid = o[10]
            let signature64 = codec.BufferToBase64(signature)
            let sk64 = codec.BufferToBase64(sk.pubKey)
            let ik64 = codec.BufferToBase64(ikp.pubKey)
            let res = $iq({type: 'set', from: ctxt._jid, id: 'anounce2'})
                .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
                .c('publish', {node: Strophe.NS.OMEMO_BUNDLES + ":" + this._id})
                .c('item')
                .c('bundle', {xmlns: Strophe.NS.OMEMO })
                .c('signedPreKeyPublic', {signedPreKeyId: sk_id}).t(sk64).up()
                .c('signedPreKeySignature').t(signature64).up()
                .c('identityKey').t(ik64).up()
                .c('prekeys')


            let keys = this.connection._signal_store.getPreKeyBundle(ctxt)
            keys.forEach(function(key) {
                res = res.c('preKeyPub', {'keyId': key.keyId}).t(codec.BufferToBase64(key.pubKey)).up()
            })

            this.connection.send(res)
        })

    },
    publish_device: function () {
        console.log("publishing device")
        var list = $build('list', {xmlns: Strophe.NS.OMEMO})
        list.c('device', {id: this._id})
        this.publish(Strophe.NS.OMEMO_DEVICELIST, [{
            data: list.tree()
        }], null)
    },
    genPreKeys: function(range) {
        console.log("generating prekeys")
        let kh = libsignal.KeyHelper
        let promises = []
        for (let i = 3; i < range + 1; i++ ) {
            promises.push(kh.generatePreKey(i).then((k) =>  {
                let key = {
                    pubKey: k.keyPair.pubKey, 
                    privKey: k.keyPair.privKey, 
                    keyId: k.keyId
                }
                this.connection._signal_store.storePreKey(i,key)
            }))
        }
        return Promise.all(promises).then(console.log("preKeys phase complete"))
    },
    new_id: function () {
        console.log("generating device id")
        let minDeviceId = 1
        let maxDeviceId = 2147483647
        let diff = (maxDeviceId - minDeviceId)
        let res = Math.floor(Math.random() * diff  + minDeviceId)
        this._id = res
        return res
    },

});


