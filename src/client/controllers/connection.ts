import { EventEmitter } from "events";

import {
  IClient,
  ConnectionProposed,
  ConnectionCreated,
  ConnectionProposal,
  IConnectionController,
  ConnectionProposeOptions,
  ConnectionRespondOptions,
} from "../../types";
import {
  uuid,
  generateKeyPair,
  parseUri,
  formatUri,
  deriveSharedKey,
  sha256,
  sanitizeJsonRpc,
  assertType,
} from "../../utils";
import { SubscriptionController } from "./subscription";

export class ConnectionController implements IConnectionController {
  public proposed: SubscriptionController<ConnectionProposed>;
  public created: SubscriptionController<ConnectionCreated>;

  private events = new EventEmitter();

  constructor(public client: IClient) {
    this.proposed = new SubscriptionController<ConnectionProposed>(client, "proposed");
    this.proposed.on("payload", (payload: any) => this.onResponse(payload));
    this.created = new SubscriptionController<ConnectionCreated>(client, "created");
    this.created.on("payload", (payload: any) => this.onMessage(payload));
  }

  public async propose(opts?: ConnectionProposeOptions): Promise<string> {
    const relay = opts?.relay || this.client.relay.default;
    const setup: ConnectionProposed = {
      topic: uuid(),
      relay,
      keyPair: generateKeyPair(),
    };
    await this.proposed.set(setup.topic, setup);

    const proposal: ConnectionProposal = {
      relay: setup.relay,
      topic: setup.topic,
      publicKey: setup.keyPair.publicKey,
    };
    return formatUri(this.client.protocol, this.client.version, setup.topic, proposal);
  }

  public async respond(opts: ConnectionRespondOptions) {
    const proposal = parseUri(opts.uri);
    assertType(proposal, "publicKey", "string");
    const keyPair = generateKeyPair();
    const relay = proposal.relay;
    const connection = await this.create({
      relay,
      privateKey: keyPair.privateKey,
      publicKey: proposal.publicKey,
    });
    this.client.relay.publish(
      proposal.topic,
      JSON.stringify(
        sanitizeJsonRpc({
          method: "wc_respondConnection",
          params: { publicKey: keyPair.publicKey },
        }),
      ),
      relay,
    );
    return connection.topic;
  }

  public async create(opts: { relay: string; privateKey: string; publicKey: string }) {
    const symKey = deriveSharedKey(opts.privateKey, opts.publicKey);
    const connection: ConnectionCreated = {
      relay: opts.relay,
      symKey,
      topic: await sha256(symKey),
    };
    await this.created.set(connection.topic, connection);
    return connection;
  }

  public async delete(opts: { topic: string }) {}

  public async onResponse(payload: any): Promise<void> {
    const topic = payload.topic;
    const proposed = await this.proposed.get(topic);
    if (!proposed) {
      throw new Error("No matching proposed connection setups");
    }
    assertType(payload, "publicKey", "string");
    const connection = await this.create({
      relay: payload.relay,
      privateKey: proposed.keyPair.privateKey,
      publicKey: payload.publicKey,
    });
    await this.proposed.del(topic);
    this.client.relay.subscribe(topic, res => this.onResponse(res), connection.relay);
    return topic;
  }

  public async onMessage(payload: any): Promise<void> {}
}
