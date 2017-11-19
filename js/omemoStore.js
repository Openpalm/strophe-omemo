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
	)}
}
