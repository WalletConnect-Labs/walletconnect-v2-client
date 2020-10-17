# Schema for session Agreements

Request is made from Client A to Client B

```js
symkeyC = ECDH(privKeyCA,pubKeyCB)

topicC = sha256(symKeyC)

bridge_request = {
    id: 1,
    jsonrpc: "2.0",
    method: "bridge_publish",
    params: [{
      topic: topicC,
      message: encryptedPayload
      ttl: 86400
  }]
}

encryptedPayload = AES256(wc_request, symKeyC)


wc_request = {
    id: 1,
    jsonrpc: "2.0",
    method: "wc_proposeSession",
    params: [sessionProposal]
}

sessionProposal = {
    proposer: <DID>,
    relay: {
        name: "bridge",
        params: {
            pubKey: <PubKey>
        }
    },
    permissions: {
        operations: {
            jsonrpc: [methods],
        },
        state: {
            blockchainAccountIds: [chainIds]
        }
    },
    expiration,
}
```

Response is made from Client B to Client A

```js
symkeyC = ECDH(privKeyCB,pubKeyCA)

topicC = sha256(symKeyC)

bridge_request = {
    id: 1,
    jsonrpc: "2.0",
    method: "bridge_publish",
    params: [{
      topic: topicC,
      payload: encryptedPayload
      ttl: 86400
  }]
}

encryptedPayload = AES256(wc_response, symKeyC)

if (clientB.supports(wc_request.permissions.operations.jsonrpc)) {
    wc_response = {
        id: 1,
        jsonrpc: "2.0",
        result: [sessionResponse]
    }

    sessionResponse = {
        responder: <DID>,
        relay: {
            name: "bridge",
            params: {
                pubKey: <PubKey>
            }
        },
        response: {
            state: {
                blockchainAccountIds: [accountIds]
            }
        }
    }
} else {
    wc_response = {
        id: 1,
        jsonrpc: "2.0",
        error: {
            code: 42000,
            message: "Does not support all requested json-rpc operations"
        }
    }
}

```

Session Transport

if bridge - use provided pubKey to generate symKey - publish to derived topic
if websocket - use provided bridgeUrl to connect - use provided pubKey to generate symKey - publish to derived topic
if webrtc - use provided offer to establish connection
else - use bridge connection type by default
