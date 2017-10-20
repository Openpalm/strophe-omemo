* [Introduction](#Introduction)
* [Report](#Report)
* [Protocols](#Protocols)
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
## Omemo & Libsignal 

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
