* [Introduction](#Introduction)
* [Report](#Report)
* [Protocol(s)](#Protocol(s))
* [Structure](#Structure)
* [Implementation](#Implementation)
* [Testing](#Testing)
* [Building](#Building)
* [Discussion](#Discussion)
* [Future Work](#Future Work)

* [Omemo](#Omemo)
* [Gcm](#Gcm)
* [Codec](#Codec)
* [SignalProtocolAddress](#SignalProtocolAddress)
* [SessionBuilder](#SessionBuilder)
* [SessionCipher](#SessionCipher)
* [References](#References)



## Introduction
An implementation of the OMEMO XMPP protocol as Strophe plugin using the 
Libsignal library, according to version 0.2 2017-06-02 of XEP-0384.[0]

The Libsignal protocol was created by Moxie Marlinspike and Trevor Perrin 
at Open Whisper Systems in order to improve upon existing secure communication 
protocols such as SCIP and OTR.[1]

Omemo was devised and developed by Andreas Straub in the autumn of 2015 and got
accepted as XEP-0384 in December 2016.[2]

[0]:https://xmpp.org/extensions/xep-0384.html 
[1]:https://signal.org/docs/specifications/doubleratchet/
[2]:https://en.wikipedia.org/wiki/OMEMO

## Abstract

## Protocol(s)

#### Glossary of Terms

### Libsignal
Conceptually, Omemo uses relies on a Libsignal session to encrypt a cipher text's 
message key, where the message key is encrypted using a shared libsignal session 
using its derived chain keys that act as the second layer of message encryption
and provide forward secrecy. libsignal message keys get deleted on a per-message-read basis and
are refreshed on message-reply basis as the session key gets *advnaced* according to
the double ratchet specification.[1]

Omemo prescribes XMPP message recipes that serve as the basis for its storage format
as well as message exchange. We will see that some book keeping information can be omitted
while still maintaining full functionality. Infact and in practice, some implementations
  omit certain pieces of information. [Richard/Lurch, citation needed]

In order to allow the protocol to function, each party must generate a *bundle* of keys:
```
1. Identity Key (IdentityKey)
2. Signed Key (keyPair, keyId, Signature)
3. Pre Key (keyPair, keyId)*
```

Parties generate 100 Pre Keys in order to publish them on a server to allow for 
sessions with multiple participants and devices. These keys are refreshed once
their count gets to <20. After which the bundle is republished.[0]

Parties should also re-generate a new signed Prekey and republish the bundle on
a weekly basis.[3]

#### X3DH Key Agreement: A-symmetric tripple Deffie Helman 


[4]:https://www.youtube.com/watch?v=7WnwSovjYMs


```
+-------------+-----------------+-------------+
|     Key     |     Purpose     |  Life Span  |
+-------------+-----------------+-------------+
| IdentitKey  | Authenticity    | Inf         |
| SignedPeKey | Authenticity    | Weekly      |
| PreKey      | Forward Secrecy | PerSession* |
| DHKey       | A-Sym-Session   | PerSession* |
| RootKey     | Sym-Internal    | PerReply    |
| ChainKey    | Sym-Internal    | PerReply    |
| CryptoKy*   | Sym-Msg-Sending | PerMessage  |
+-------------+-----------------+-------------+
```


Procedure and *Arming*
```
1. Both parties advertise their 


```

## Project Structure 
  
### Processing Messages

## Implementation

## Testing

## Discussion 

## Omemo

#### new Omemo(number, deviceId)

## Gcm
## Codec

## SignalProtocolAddress


#### new SignalProtocolAddress(number, deviceId)

Constructs a new SignalProtocolAddress.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| `number`          | *String*        | [The storage interface](#SignalProtocolStore). 
| `deviceId`        | *Number*        | Remote address

#### SignalProtocolAddress.fromString(str)

Constructs a new SignalProtocolAddress from a string.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| `str`           | *String*        | 

#### SignalProtocolAddress.getName()

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| **returns**     | *String*        |

#### SignalProtocolAddress.getDeviceId()

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| **returns**     | *Number*        |

#### SignalProtocolAddress.toString()

Convert the address into it's string form.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| **returns**     | *String*        |

#### SignalProtocolAddress.equals(signalProtocolAddress)

Compares one address to another.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| **returns**     | Boolean         |

---

## SessionBuilder

#### new SessionBuilder(store, address)

Constructs a new SessionBuilder.

| Parameter       | Type                  | Description
|-----------------|-----------------------|---------------
| `store`         | [*SignalProtocolStore*](#SignalProtocolStore) | A storage interface
| `address`       | [*SignalProtocolAddress*](#SignalProtocolAddress) | A remote address

#### SessionBuilder.processPreKey(preKeyBundle)

Create a new session from a PreKey bundle returned by the server.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| preKeyBundle    | *Object*        | `{ registrationId: <Number>, identityKey: <ArrayBuffer>, signedPreKey:        { keyId: <Number>, publicKey: <ArrayBuffer>, signature: <ArrayBuffer> },    preKey: { keyId: <Number>,        publicKey : <ArrayBuffer> } }`
| **returns**     | *Promise*       |

#### SessionBuilder.processV3(record, preKeyWhisperMessage)

Construct a new session from a preKeyWhisperMessage. Modifies the given record object but does not save the change to the store. This method is not used in practice, as it is automatically called internally by decryptPreKeyWhisperMessage.

| Parameter            | Type                 | Description
|----------------------|----------------------|-----------------
| record               | *SessionRecord*      |
| preKeyWhisperMessage | *PreKeyWhisperMessage* |
| **returns**         | *Promise*              |

## SessionCipher

#### new SessionCipher(store, address)

Constructs a new SessionCipher.

| Parameter       | Type            | Description
|-----------------|-----------------|---------------
| `store`         | [*SignalProtocolStore*](#SignalProtocolStore) | A storage interface
| `address`       | [*SignalProtocolAddress*](#SignalProtocolAddress) | A remote address

#### SessionCipher.encrypt(message, encoding=)

Encrypt a message to the cipher's address.

| Parameter       | Type            | Description
|-----------------|-----------------|-----------------
| message         |  *ByteBuffer* &#124; *ArrayBuffer* &#124; *Uint8Array* &#124; *String* | Anything that can be [wrapped by a ByteBuffer](https://github.com/dcodeIO/bytebuffer.js/wiki/API#bytebufferwrapbuffer-encoding-littleendian-noassert)
| encoding        | *String*        | String encoding if `message` is a string ("base64", "hex", "binary", defaults to "utf8") 
| **returns**     | *Promise*         | resolves to object: `{type: <Number>, body: <String>}`

#### SessionCipher.decryptWhisperMessage(message, encoding=)

Decrypt a normal message.

| Parameter       | Type            | Description
|-----------------|-----------------|-----------------
| message         |  *ByteBuffer* &#124; *ArrayBuffer* &#124; *Uint8Array* &#124; *String* | Anything that can be [wrapped by a ByteBuffer](https://github.com/dcodeIO/bytebuffer.js/wiki/API#bytebufferwrapbuffer-encoding-littleendian-noassert)
| encoding        | *String*        | String encoding if `message` is a string ("base64", "hex", "binary", defaults to "utf8") 
| **returns**    | *Promise*         | resolves to ArrayBuffer

#### SessionCipher.decryptPreKeyWhisperMessage(message, encoding=)

Decrypt a PreKey message.

| Parameter       | Type            | Description
|-----------------|-----------------|-----------------
| message         |  *ByteBuffer* &#124; *ArrayBuffer* &#124; *Uint8Array* &#124; *String* | Anything that can be [wrapped by a ByteBuffer](https://github.com/dcodeIO/bytebuffer.js/wiki/API#bytebufferwrapbuffer-encoding-littleendian-noassert)
| encoding        | *String*        | String encoding if `message` is a string ("base64", "hex", "binary", defaults to "utf8") 
| **returns**    | *Promise*         | resolves to ArrayBuffer

---
