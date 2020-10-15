import { EventEmitter } from "events";

import {
  IClient,
  ConnectionProposed,
  ConnectionCreated,
  ConnectionProposal,
  IConnection,
  ConnectionProposeParams,
  ConnectionRespondParams,
  ConnectionCreateParams,
  ConnectionDeleteParams,
  ConnectionResponded,
} from "../../types";
import {
  generateKeyPair,
  parseUri,
  formatUri,
  deriveSharedKey,
  sha256,
  formatJsonRpcRequest,
  assertType,
  generateTopic,
  formatJsonRpcError,
  formatJsonRpcResult,
  safeJsonParse,
} from "../../utils";
import { Subscription } from "./subscription";

export class Connection extends IConnection {
  public proposed: Subscription<ConnectionProposed>;
  public responded: Subscription<ConnectionResponded>;
  public created: Subscription<ConnectionCreated>;

  protected events = new EventEmitter();

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<ConnectionProposed>(client, "proposed");
    this.proposed.on("message", ({ topic, message }) => this.onResponse(topic, message));
    this.responded = new Subscription<ConnectionResponded>(client, "responded");
    this.responded.on("message", ({ topic, message }) => this.onAcknowledge(topic, message));
    this.created = new Subscription<ConnectionCreated>(client, "created");
    this.created.on("message", ({ topic, message }) => this.onMessage(topic, message));
  }

  public async propose(params?: ConnectionProposeParams): Promise<ConnectionProposal> {
    const relay = params?.relay || this.client.relay.default;
    const setup: ConnectionProposed = {
      relay,
      topic: await generateTopic(),
      keyPair: generateKeyPair(),
    };
    await this.proposed.set(setup.topic, setup);

    const proposal: ConnectionProposal = {
      relay: setup.relay,
      topic: setup.topic,
      publicKey: setup.keyPair.publicKey,
    };
    return proposal;
  }

  public async respond(params: ConnectionRespondParams): Promise<ConnectionResponded> {
    const proposal = params.proposal;
    assertType(proposal, "publicKey", "string");
    const keyPair = generateKeyPair();
    const topic = proposal.topic;
    const relay = proposal.relay;
    const connection = await this.create({
      relay,
      privateKey: keyPair.privateKey,
      publicKey: proposal.publicKey,
    });
    const request = formatJsonRpcRequest("wc_respondConnection", {
      publicKey: proposal.publicKey,
    });
    this.client.relay.publish(topic, JSON.stringify(request), proposal.relay);
    const responded: ConnectionResponded = {
      ...proposal,
      connection,
    };
    this.responded.set(responded.topic, responded);
    return responded;
  }

  public async create(params: ConnectionCreateParams): Promise<ConnectionCreated> {
    const symKey = deriveSharedKey(params.privateKey, params.publicKey);
    const connection: ConnectionCreated = {
      relay: params.relay,
      symKey,
      topic: await sha256(symKey),
    };
    await this.created.set(connection.topic, connection);
    return connection;
  }

  public async delete(params: ConnectionDeleteParams): Promise<void> {
    // TODO: implement delete
  }

  public on(event: string, listener: any): void {
    this.events.on(event, listener);
  }

  public once(event: string, listener: any): void {
    this.events.once(event, listener);
  }

  public off(event: string, listener: any): void {
    this.events.off(event, listener);
  }

  // ---------- Protected ----------------------------------------------- //

  protected async onResponse(topic: string, message: string): Promise<void> {
    const request = safeJsonParse(message);
    const proposed = await this.proposed.get(topic);
    try {
      assertType(request, "publicKey", "string");
      await this.create({
        relay: request.relay,
        privateKey: proposed.keyPair.privateKey,
        publicKey: request.publicKey,
      });
      const response = formatJsonRpcResult(request.id, true);
      this.client.relay.publish(topic, JSON.stringify(response), proposed.relay);
    } catch (e) {
      const response = formatJsonRpcError(request.id, e.message);
      this.client.relay.publish(topic, JSON.stringify(response), proposed.relay);
    }
    await this.proposed.del(topic);
  }

  protected async onAcknowledge(topic: string, message: string): Promise<void> {
    const response = safeJsonParse(message);
    const responded = await this.responded.get(topic);
    if (response.error) {
      this.created.del(responded.connection.topic);
    }
    this.responded.del(topic);
  }

  protected async onMessage(topic: string, message: string): Promise<void> {
    this.events.emit("message", { topic, message });
  }
}
