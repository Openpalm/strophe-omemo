admins = { "admin1@localhost", "admin2@localhost" }


modules_enabled = {

		"roster"; -- Allow users to have a roster. Recommended ;)
		"saslauth"; -- Authentication for clients and servers. Recommended if you want to log in.
		"tls"; -- Add support for secure TLS on c2s/s2s connections
		"dialback"; -- s2s dialback support
		"disco"; -- Service discovery
		"carbons"; -- Keep multiple clients in sync
		"pep"; -- Enables users to publish their mood, activity, playing music and more
		"private"; -- Private XML storage (for room bookmarks, etc.)
		"blocklist"; -- Allow users to block communications with other users
		"vcard"; -- Allow users to set vCards
		"version"; -- Replies to server version requests
		"uptime"; -- Report how long server has been running
		"time"; -- Let others know the time here on this server
		"ping"; -- Replies to XMPP pings with pongs
		"register"; -- Allow users to register on this server using a client and change passwords
		"admin_adhoc"; -- Allows administration via an XMPP client that supports ad-hoc commands
		"admin_telnet"; -- Opens telnet console interface on localhost port 5582
		"bosh"; -- Enable BOSH clients, aka "Jabber over HTTP"
		"announce"; -- Send announcement to all online users
		"welcome"; -- Welcome users who register accounts
		"watchregistrations"; -- Alert admins of registrations
}

modules_disabled = {
}

allow_registration = true
c2s_require_encryption = true
s2s_require_encryption = true
s2s_secure_auth = false
authentication = "internal_hashed"
consider_bosh_secure = true
cross_domain_bosh = true
archive_expires_after = "1w" -- Remove archived messages after 1 week

log = {
	debug = "/var/log/prosody/prosody.log"; -- Change 'info' to 'debug' for verbose logging
	error = "/var/log/prosody/prosody.err"; -- Log errors also to file
}


certificates = "/etc/pki/prosody/"
pidfile = "/run/prosody/prosody.pid";
Host "*"
    c2s_interface = "127.0.0.1"
    s2s_interface = "127.0.0.1"


Host "localhost"


Include "conf.d/*.cfg.lua"
