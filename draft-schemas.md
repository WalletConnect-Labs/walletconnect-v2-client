# Schema for session Agreements


Request is made from Client A to Client B


```json
symkeyC = ECDH(privKeyCA,pubKeyCB)

topicC = sha256(symKeyC)

waku_request = {
    id: 1,
    jsonrpc: "2.0",
    method: "waku_post",
    params: [{
      pubKey: 'b874f3bbaf031214a567485b703a025cec27d26b2c4457d6b139e56ad8734cea',
      ttl: 7,
      topic: topicC,
      powTarget: 2.01,
      powTime: 2,
      payload: encryptedPayload
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
    transport: {
        type: "waku",
        params: {
            pubKey: <PubKey>
        }
    },
    permissions: {
        operations: {
            jsonrpc: [methods],
        },
        disclosure: {
            blockchainAccountIds: [chainIds]
        }
    },
    expiration,
}
```

Response is made from Client B to Client A

```json
symkeyC = ECDH(privKeyCB,pubKeyCA)

topicC = sha256(symKeyC)

waku_request = {
    id: 1,
    jsonrpc: "2.0",
    method: "waku_post",
    params: [{
      pubKey: 'b874f3bbaf031214a567485b703a025cec27d26b2c4457d6b139e56ad8734cea',
      ttl: 7,
      topic: topicC,
      powTarget: 2.01,
      powTime: 2,
      payload: encryptedPayload
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
        transport: {
            type: "waku",
            params: {
                pubKey: <PubKey>
            }
        },
        response: {
            disclosure: {
                blockchainAccountIds:[{
                    accountsIDs,
                    signingCapabilities
                }]
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


if waku
    - use provided pubKey to generate symKey
    - publish to derived topic
if websocket
    - use provided bridgeUrl to connect
    - use provided pubKey to generate symKey
    - publish to derived topic
if webrtc
    - use provided offer to establish connection
else
    - use waku connection type by default
