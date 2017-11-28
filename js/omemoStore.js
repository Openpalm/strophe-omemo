'use strict';
// todo have this pickle into localStorage directly.

//Klaus code
//put: function(key, value) {
//        if (key === undefined || value === undefined || key === null || value === null)
//            throw new Error("Tried to store undefined/null");
//
//        var stringified = JSON.stringify(value, function(key, value) {
//            if (value instanceof ArrayBuffer) {
//                return arrayBufferToArray(value)
//            }
//
//            return value;
//        });
//
//        // this.store[key] = value;
//        localStorage.setItem(this.prefix + ':' + key, stringified);
//    },
//    get: function(key, defaultValue) {
//        if (key === null || key === undefined)
//            throw new Error("Tried to get value for undefined/null key");
//        if (this.prefix + ':' + key in localStorage) {
//            // return this.store[key];
//            return JSON.parse(localStorage.getItem(this.prefix + ':' + key), function(key, value) {
//                if (/Key$/.test(key)) {
//                    return ArrayToArrayBuffer(value);
//                }
//
//                return value;
//            });
//        } else {
//            return defaultValue;
//        }
//    },
//
//function arrayBufferToArray(buffer) { return Array.apply([], new Uint8Array(buffer)); }
//
//function ArrayToArrayBuffer(array) { return new Uint8Array(array).buffer }
function OmemoStore () {
	this.Sessions 	= {}
}

function publicOmemoStore () {
	//the following definitions serve as an interface
	this.rids = [] //all devices belonging to a jid
	this.rid = 0
	this.jid = null
	this.signedPreKey = {
		//slightly different than LibsignalStore with the signature included in the tupel.
		publicKey: null,
		keyId: null,
		signature: null,
	},
	this.IdentityKey = null,
	this.getPublicBundle = function () {
		let prk = this.selectRandomPreKey()
		return {
			registrationId: this.rid,
			identityKey: this.identityKey,
			signedPreKey: {
				keyId     : this.keyId,
				publicKey : this.publicKey,
				signature : this.signature
			},
			preKey: {
				keyId     : prk.keyId,
				publicKey : prk.pubKey
			}
		}
	},
	this.selectRandomPreKey =  function() {
		//track key # here
		let range = 100
		let id = 1
		let key = undefined
		while (key == undefined) {
			id = Math.floor(Math.random() * range) + 1
			key = this.getPreKey(id)
		}
		return key
	},
	this.putPreKey = function (jid, rid, keyId, key) {
		this.put(jid + ":" + rid + ":" + "preKeyPub" + keyId, key);
	},
	this.getPreKey = function(jid, rid, keyId) {
		let res = this.get(jid + ":" + rid + ":" + "preKeyPub" + keyId);
		if (res !== undefined) {
			return res
		}
		// should never happen. should still be handeled.
		return undefined
	},
	this.put = function(jid, rid, key, value) {
		if (key === undefined || value === undefined || key === null || value === null)
		throw new Error("Tried to store undefined/null");
		this[jid + ":" + rid + ":" + key] = value;
	},
	this.get = function(jid, rid, key, defaultValue = undefined) {
		if (key === null || key === undefined)
		throw new Error("Tried to get value for undefined/null key");
		if (key in this) {
			return this[jid + ":" + rid + ":" + key];
		} else {
			return defaultValue;
		}
	},
	this.remove = function(key) {
		if (key === null || key === undefined)
		throw new Error("Tried to remove value for undefined/null key");
		delete this[jid + ":" + rid + ":" +key];
	}
}

// OmemoStore per jid with ids => flag?
OmemoStore.prototype = {
	add: function (jid, cipher, flag) {
		Promise.resolve(cipher.getRemoteRegistrationId().then(id => {
			if (this.Sessions[jid] === undefined) {
				this.Sessions[jid] = {}
			}
			let record =  {
				bundle: new publicOmemoStore(), // created from received bundle
				//this does not work.
				cipher: cipher, //can first be empty
				preKeyFlag: flag,
			}

			record["bundle"]["jid"] = jid
			record["bundle"]["rid"] = id

			this.Sessions[jid][id] = record
		})
	)},

	getSessions: function (jid) {
		return this.Sessions[jid]
	},
	getSessionsCount: function (jid) {
		return this.Sessions[jid].length
	},
	dropSessions: function (jid) {
		this.Sessions[jid] = []
	},
	encryptPayloadsForSession: function (jid, keyCipherText, tag , ctxt) {
		let promises = []

		for (let k in this.Sessions[jid]) {
			promises.push(
				this.Sessions[jid][k].cipher.encrypt(keyCipherText + tag).then(enc => {
					this.Sessions[jid][k].payload = ctxt._codec.StringToBase64(enc.body)
				})
			)
		}

		return Promise.all(promises).then(o => {
			return Promise.resolve(this.Sessions[jid])
		})
	},
	getRecord: function(jid, rid) {
		let isEqual = function (o) {
			return o.bundle.rid == rid
		}
		return Promise.resolve(this.Sessions[jid].filter(isEqual))
	},
	getPayload: function (jid, index) {
		//future serves constructEncryptedStanza
		return Promise.resolve(this.Sessions[jid][index].payload)
	},
	hasSession: function (jid) {
		let records = this.getSessions(jid)
		if (records == undefined) { return false }
		else { return true }
	},
	hasSessionForRid: function (jid, rid) {
		let records = this.getSessions(jid)
		for (let i in records) {
			records[i].cipher
		}
	},
	getDeviceIdList: function (jid) {
		let res = []
		for (let i in this.Sessions[jid]) {
				res.push(i)
		}
		return res
	},
	hasBundle: function(jid, rid) {
		//should check identityKey and signedKey,
		//devices are initiated with an empty bundle
		return this.getBundle(jid, rid)  != undefined
	},
	hasCipher: function(jid, rid) {
		return this.getCipher(jid, rid)  != undefined
	},
	getBundle: function (jid, rid) {
		try {
			return this.Sessions[jid][rid].bundle
		} catch(e) {
			return undefined
		}
	},
	getCipher: function (jid, rid) {
		try {
			return this.Sessions[jid][rid].cipher
		} catch(e) {
			return undefined
		}
	}
}
