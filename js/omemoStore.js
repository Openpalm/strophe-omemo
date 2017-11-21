'use strict';

function OmemoStore () {
	this.Sessions 	= {}
}

// OmemoStore per jid with ids => flag?
OmemoStore.prototype = {
	add: function (jid, cipher, flag) {
		Promise.resolve(cipher.getRemoteRegistrationId().then(id => {
			if (this.Sessions[jid] === undefined) {
				this.Sessions[jid] = []
			}
			this.Sessions[jid].push({
				publicBundle: null, // created from received bundle
				jid: jid,
				rid: id,
				cipher: cipher, //can first be empty
				preKeyFlag: flag
			})
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
	encryptPayloadsForSession: function (jid, msgObj, ctxt) {
		for (let k in this.Sessions[jid]) {
			this.Sessions[jid][k].cipher.encrypt(msgObj.LSPLD + msgObj.OMMSG.tag).then(enc => {
				this.Sessions[jid][k].payload = ctxt._codec.StringToBase64(enc.body)
			})
		}
	}
}
