import { AbstractController } from "./abstract";

import {
  WalletConnectClient,
  ConnectionPending,
  ConnectionActive,
  ConnectionProposal,
} from "../../types";
import {
  uuid,
  generateKeyPair,
  parseUri,
  formatUri,
  deriveSharedKey,
  sha256,
  sanitizeJsonRpc,
} from "../../utils";

export class ConnectionController implements AbstractController {
  public pending: ConnectionPending[] = [];
  public active: ConnectionActive[] = [];

  constructor(public client: WalletConnectClient) {}

  public async propose(opts?: { relay: string }): Promise<string> {
    const relay = opts?.relay || this.client.relay.default;
    const setup: ConnectionPending = {
      topic: uuid(),
      relay,
      keyPair: generateKeyPair(),
    };
    this.pending.push(setup);

    this.client.relay.clients[setup.relay].subscribe(setup.topic, res =>
      this.onResponse(setup.topic, res),
    );
    const proposal: ConnectionProposal = {
      publicKey: setup.keyPair.publicKey,
      relay: setup.relay,
    };
    return formatUri(this.client.protocol, this.client.version, setup.topic, proposal);
  }

  public async respond(opts: { uri: string }) {
    const proposal = parseUri(opts.uri);
    if (!proposal.publicKey || typeof proposal.publicKey !== "string") {
      throw new Error("Missing or invalid public key received");
    }
    const keyPair = generateKeyPair();
    const relay = proposal.relay;
    const connection = await this.create({
      relay,
      privateKey: keyPair.privateKey,
      publicKey: proposal.publicKey,
    });
    this.client.relay.clients[relay].publish(
      proposal.topic,
      JSON.stringify(
        sanitizeJsonRpc({
          method: "wc_respondConnection",
          params: { publicKey: keyPair.publicKey },
        }),
      ),
    );
    this.client.relay.clients[relay].subscribe(connection.topic, res =>
      this.onAcknowledge(connection.topic, res),
    );
    return connection.topic;
  }

  public async create(opts: { relay: string; privateKey: string; publicKey: string }) {
    const symKey = deriveSharedKey(opts.privateKey, opts.publicKey);
    const connection: ConnectionActive = {
      relay: opts.relay,
      symKey,
      topic: await sha256(symKey),
    };
    this.active.push(connection);
    return connection;
  }

  public async delete() {}

  public async onResponse(topic: string, response: any) {
    const pending = this.pending.find(h => h.topic === topic);
    if (!pending) {
      throw new Error("No matching pending connection setups");
    }
    if (!response.publicKey || typeof response.publicKey !== "string") {
      throw new Error("Missing or invalid public key received");
    }
    this.pending = this.pending.filter(h => h.topic === pending.topic);
    const connection = await this.create({
      relay: response.relay,
      privateKey: pending.keyPair.privateKey,
      publicKey: response.publicKey,
    });
    this.client.relay.clients[connection.relay].subscribe(topic, res =>
      this.onResponse(topic, res),
    );
    return topic;
  }

  public async onAcknowledge(topic: string, response: any) {}
}
