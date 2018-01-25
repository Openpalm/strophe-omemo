let codec = require('./codec.js')
let symCipher = require('./gcm.js')
//let $ = require('jquery')

//let symCipher = require('./EAX.js')
//let symCipher = require('./xChaCha20.js')

let record = {
    jid: null,
    devices: null
}

let users = {}

let omemo = {
    init: function (conn) {
        omemo.connection = conn;

        Strophe.addNamespace('OMEMO',         
            'eu.siacs.conversations.axolotl')
        Strophe.addNamespace('OMEMO_BUNDLES', 
            'eu.siacs.conversations.axolotl.bundles')
        Strophe.addNamespace('OMEMO_DEVICELIST', 
            'eu.siacs.conversations.axolotl.devicelist')

        omemo.publish = omemo.connection.pep.publish
        //        subscribe @ app.connected in the main application logic file xmpplore.js
        //        this.subscribe(Strophe.NS.OMEMO_DEVICELIST)                   

    },
    setup: function (jid) {
        if (!localStorage.getItem(jid)) {
            var id = omemo.gen_id()
            console.log(id)
            localStorage.setItem(jid, id)
        }
        omemo._jid = jid
        omemo._id = id
        try { 
            if (libsignal) {
            } 
        } catch(e) { 
            throw new Error ("Libsignal-Protocol not found")
        }
        try { 
            if (SignalProtocolStore) {
                omemo.connection._signal_store = new SignalProtocolStore(jid, id)
            } 
        } catch(e) { 
            throw new Error ("SignalProtocolStore not found")
        }
        //   try { 
        //       if (OmemoStore) {
        //           omemo.connection._omemo_store = new OmemoStore(jid, id) //probably not needed
        //       } 
        //   } catch(e) { 
        //       throw new Error ("SignalProtocolStore not found")
        //   }

        Promise.all([omemo.arm()]).then(e => {
            console.log("armed") 
            omemo.connection.addHandler(
                omemo.on_headline,
                null,
                "message",
                "headline")
   omemo.connection.addHandler(
                omemo.on_headline,
                null,
                "iq",
                null,
                "fetch1")

        })
    },
    on_success: function () { 
        omemo.publish_bundle()
        omemo.publish_device()
        return false
    },
    arm: function () {
        let kh  = libsignal.KeyHelper
        let registrationId = ''
        Promise.all([
            kh.generateIdentityKeyPair(),
            omemo.gen_prekeys(100)
        ]).then(function(result) {
            let identity = result[0];
            registrationId = omemo._id
            omemo.connection._signal_store.put('registrationId', registrationId)
            omemo.connection._signal_store.put('identityKey', result[0])
            omemo.connection._signal_store.getIdentityKeyPair().then((ikey) =>
                kh.generateSignedPreKey(ikey, 1)).then((skey) => {
                    let key = {
                        pubKey: skey.keyPair.pubKey,
                        privKey: skey.keyPair.privKey,
                        keyId: skey.keyId,
                        signature: skey.signature
                    }
                    omemo.connection._signal_store.storeSignedPreKey(1, key)
                })
            omemo._address = new libsignal.SignalProtocolAddress(omemo._jid, omemo.connection._signal_store.get('registrationId'));
        }).then( o => { 
            omemo.connection._signal_store.setLocalStore(omemo._jid, omemo._id)

        })


    },
    on_bundle: function (stanza) {
        let sk, sk_id, signature, ik, from_id, from, 
            _key, pkey, pkey_id, record, res, address, 
            c_key, public_bundle
        let ctr = 0
        let pkeys = [] 

        $(stanza).find('items').each(function () {
            from_id = parseInt($(this).attr('node').split(":")[1])
        })
       from = $(stanza).attr('from')
        $(stanza).find('signedPreKeyPublic').each(function () {
            sk_id = parseInt($(this).attr('signedPreKeyId'))
            sk = codec.Base64ToBuffer($(this).text())
        })
        $(stanza).find('signedPreKeySignature').each(function () {
            signature = codec.Base64ToBuffer($(this).text())
        })
        $(stanza).find('preKeyPub').each(function () {
            pkey = codec.Base64ToBuffer($(this).text())
            pkey_id  = $(this).attr('keyId')
            _key = {id: pkey_id, key: pkey}
            ctr = ctr + 1
            pkeys.push(_key)
        })
        $(stanza).find('identityKey').each(function() {
            ik = codec.Base64ToBuffer($(this).text())
        })          
        c_key = Math.floor(Math.random() * ctr - 1) // consider using a better source of randomness
        public_bundle =  {
            registrationId: from_id,
            identityKey: ik,
            signedPreKey: {
                keyId     : sk_id,
                publicKey : sk,
                signature : signature,
            },
            preKey: {
                keyId     : pkeys[c_key].id,
                publicKey : pkeys[c_key].key,
            }
        }
        res = { jid: from, public_bundle:  public_bundle }
        //address = new libsignal.SignalProtocolAddress(res.jid, res.public_bundle.registrationId)
        record = JSON.parse(localStorage.getItem(res.jid))
        for (let i in record) {
            record[i] = res.public_bundle
        }
        localStorage.setItem(res.jid, JSON.stringify(record))
        return true 
    },
    on_device: function (stanza) {
        if (omemo._id == undefined || stanza == null) { throw "on_device: stanza null or id not set " }
        let id, appendand, from, 
            were_in = false
        let me = omemo._jid
        let my_id = omemo._id
        let ids = {}

        from = $(stanza).attr("from")
        if (from == me) {
        ids[my_id] = ''
            $(stanza).find("device").each(function() {
                var nid = $(this).attr('id')
                ids[nid] = ''
                if (nid == my_id) {
                    were_in = true
                }
            })
            if (were_in) { 
                return true 
            }
            var res = $iq({type: 'set', from: omemo._jid, id: 'anounce1'})
                .c('pubsub',    {xmlns: 'http://jabber.org/protocol/pubsub'})
                .c('publish',   {node: Strophe.NS.OMEMO_DEVICELIST})
                .c('item')
                .c('list',      {xmlns: Strophe.NS.OMEMO})

            for (var i in ids) {
                res.c('device', {id: i }).up()
            }
            omemo.connection.send(res)
            return true
        }
        $(stanza).find("device").each(function() {
             var tid = $(this).attr('id')
             ids[tid] = ''
        })
        localStorage.setItem(from, JSON.stringify(ids))
        return true
    },
    on_message: function (stanza) {
        console.log("onemessage")
        return true
    },

    on_headline: function (stanza) {
        if(omemo.is_device(stanza)) {
            omemo.on_device(stanza)
            return true
        }
        else if(omemo.is_bundle(stanza)) {
            omemo.on_bundle(stanza)
            return true
        }
        return true 
    },
    fetch_bundle: function (to) {
        let res = ''
        let ids = JSON.parse(localStorage.getItem(to))
        for (let i in ids) {
            res = $iq({type: 'get', from: omemo._jid, to: to, id: 'fetch1'})
                .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
                .c('items', {node: Strophe.NS.OMEMO_BUNDLES + ":" + i}) 
            omemo.connection.send(res)
        }
    },
    refresh_bundle: function () {

    },
    publish_bundle: function () {
        let sk_id = 1

        let promises = [
            omemo.connection._signal_store.loadSignedPreKey(sk_id),
            omemo.connection._signal_store.getIdentityKeyPair(),
            omemo.connection._signal_store.loadSignedPreKeySignature(sk_id),
            omemo.connection._signal_store.getLocalRegistrationId()
        ]
        return Promise.all(promises).then(o => {
            let sk = o[0]
            let ikp = o[1]
            let signature = o[2]
            let rid = o[10]
            let signature64 = codec.BufferToBase64(signature)
            let sk64 = codec.BufferToBase64(sk.pubKey)
            let ik64 = codec.BufferToBase64(ikp.pubKey)
            let res = $iq({type: 'set', from: omemo._jid, id: 'anounce2'})
                .c('pubsub', {xmlns: 'http://jabber.org/protocol/pubsub'})
                .c('publish', {node: Strophe.NS.OMEMO_BUNDLES + ":" + omemo._id})
                .c('item')
                .c('bundle', {xmlns: Strophe.NS.OMEMO })
                .c('signedPreKeyPublic', {signedPreKeyId: sk_id}).t(sk64).up()
                .c('signedPreKeySignature').t(signature64).up()
                .c('identityKey').t(ik64).up()
                .c('prekeys')


            let keys = omemo.connection._signal_store.getPreKeyBundle(omemo)
            keys.forEach(function(key) {
                res = res.c('preKeyPub', {'keyId': key.keyId}).t(codec.BufferToBase64(key.pubKey)).up()
            })

            omemo.connection.send(res)
        })

    },
    publish_device: function () {
        var list = $build('list', {xmlns: Strophe.NS.OMEMO})
        list.c('device', {id: omemo._id})
        omemo.connection.pep.publish(Strophe.NS.OMEMO_DEVICELIST, [{
            data: list.tree()
        }], null)
    },
    gen_prekeys: function(range) {
        let kh = libsignal.KeyHelper
        let promises = []
        for (let i = 1; i < range + 1; i++ ) {
            promises.push(kh.generatePreKey(i).then((k) =>  {
                let key = {
                    pubKey: k.keyPair.pubKey, 
                    privKey: k.keyPair.privKey, 
                    keyId: k.keyId
                }
                omemo.connection._signal_store.storePreKey(i,key)
            }))
        }
        return Promise.all(promises)
    },
    gen_id: function () {
        let minDeviceId = 1
        let maxDeviceId = 2147483647
        let diff = (maxDeviceId - minDeviceId)
        let res = Math.floor(Math.random() * diff  + minDeviceId)
        omemo._id = res
        return res
    },
    is_device: function (stanza)  {
        return $(stanza).find("list").length != 0
    },
    is_bundle: function (stanza)  {
        return $(stanza).find("bundle").length != 0
    },
    send: function (receiver_jid, clear_text) {
    
    },
    recieve: function (stanza) {},

}

Strophe.addConnectionPlugin('omemo', omemo)
