'use strict';

function OmemoStore () {
	this.Sessions 	= {}
}

function publicOmemoStore () {
	//the following definitions serve as an interface
	this.signedPreKey = {
		publicKey: null,
		id: null,
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
	this.getPreKey = function(keyId) {
		let res = this.preKeys.get('25519KeypreKey' + keyId);
		if (res !== undefined) {
			return res
		}
		return undefined
	},
	this.put = function(key, value) {
		if (key === undefined || value === undefined || key === null || value === null)
		throw new Error("Tried to store undefined/null");
		this[key] = value;
	},
	this.putPreKey = function (id, key) {
		this.put('25519KeypreKey' + id, key);
	},
	this.get = function(key, defaultValue = undefined) {
		if (key === null || key === undefined)
		throw new Error("Tried to get value for undefined/null key");
		if (key in this) {
			return this[key];
		} else {
			return defaultValue;
		}
	},
	this.remove = function(key) {
		if (key === null || key === undefined)
		throw new Error("Tried to remove value for undefined/null key");
		delete this[key];
	}
}

// OmemoStore per jid with ids => flag?
OmemoStore.prototype = {
	add: function (jid, cipher, flag) {
		Promise.resolve(cipher.getRemoteRegistrationId().then(id => {
			if (this.Sessions[jid] === undefined) {
				this.Sessions[jid] = []
			}
			let record =  {
				bundle: new publicOmemoStore(), // created from received bundle
				jid: jid,
				rid: id,
				cipher: cipher, //can first be empty
				preKeyFlag: flag,

			}
			this.Sessions[jid].push(record)
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
			return o.rid == rid
		}
		return Promise.resolve(this.Sessions[jid].filter(isEqual))
	},
	getPayload: function (jid, index) {
		//serves constructEncryptedStanza
		return Promise.resolve(this.Sessions[jid][index].payload)
	}
}
