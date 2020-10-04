import IsomorphicStore from "./store";
import WakuClient from "./waku";

import { Handshake, Connection, Session } from "./types";
import {
  uuid,
  generateKeyPair,
  formatUri,
  deriveSharedKey,
  sha256,
  sanitizeJsonRpc,
} from "./utils";
import { parseUri } from "./utils/uri";
import { assert } from "console";

class WalletConnectClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  public handshakes: Handshake[] = [];
  public connections: Connection[] = [];
  public sessions: Session[] = [];

  public store: IsomorphicStore = new IsomorphicStore();
  public waku: WakuClient = new WakuClient();

  public async proposeConnection() {
    const handshake: Handshake = {
      topic: uuid(),
      relay: "waku",
      keyPair: generateKeyPair(),
    };
    this.handshakes.push(handshake);
    this.waku.subscribe(handshake.topic, res => this.onHandshakeResponse(handshake.topic, res));
    return formatUri(this.protocol, this.version, handshake.topic, {
      publicKey: handshake.keyPair.publicKey,
      relay: handshake.relay,
    });
  }

  public async respondConnection(uri: string) {
    const proposal = parseUri(uri);
    if (!proposal.publicKey || typeof proposal.publicKey !== "string") {
      throw new Error("Missing or invalid public key received");
    }
    const keyPair = generateKeyPair();
    const symKey = deriveSharedKey(keyPair.privateKey, proposal.publickey);
    const connection: Connection = {
      relay: proposal.relay,
      symKey,
      topic: await sha256(symKey),
    };
    this.waku.publish(
      proposal.topic,
      JSON.stringify(
        sanitizeJsonRpc({ method: "wc_initConnection", params: { publicKey: keyPair.publicKey } }),
      ),
    );
    this.waku.subscribe(connection.topic, res => this.onConnectionResponse(connection.topic, res));
    return connection.topic;
  }
  // ---------- Private ----------------------------------------------- //

  private async onHandshakeResponse(topic: string, response: any) {
    const match = this.handshakes.find(h => h.topic === topic);
    if (!match) {
      throw new Error("No matching pending handshake response expected");
    }
    if (!response.publicKey || typeof response.publicKey !== "string") {
      throw new Error("Missing or invalid public key received");
    }
    this.handshakes = this.handshakes.filter(h => h.topic === match.topic);
    const symKey = deriveSharedKey(match.keyPair.privateKey, response.publickey);
    const connection: Connection = {
      relay: match.relay,
      symKey,
      topic: await sha256(symKey),
    };
    this.waku.subscribe(connection.topic, res => this.onConnectionResponse(connection.topic, res));
    return connection.topic;
  }

  private async onConnectionResponse(topic: string, response: any) {
    // TODO: handle connection responses
  }
}

export default WalletConnectClient;
