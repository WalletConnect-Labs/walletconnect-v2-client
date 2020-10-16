import { EventEmitter } from "events";

import {
  IClient,
  ConnectionProposed,
  ConnectionSettled,
  ConnectionProposal,
  IConnection,
  ConnectionProposeParams,
  ConnectionRespondParams,
  ConnectionSettleParams,
  ConnectionDeleteParams,
  ConnectionResponded,
  MessageEvent,
  ConnectionCreateParams,
  CreatedEvent,
  DeletedEvent,
} from "../../types";
import {
  generateKeyPair,
  deriveSharedKey,
  sha256,
  formatJsonRpcRequest,
  assertType,
  generateTopic,
  formatJsonRpcError,
  formatJsonRpcResult,
  safeJsonParse,
  isConnectionFailed,
} from "../../utils";
import { Subscription } from "./subscription";

export class Connection extends IConnection {
  public proposed: Subscription<ConnectionProposed>;
  public responded: Subscription<ConnectionResponded>;
  public settled: Subscription<ConnectionSettled>;

  protected events = new EventEmitter();

  protected context = "connection";

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<ConnectionProposed>(client, {
      name: this.context,
      status: "proposed",
    });
    this.responded = new Subscription<ConnectionResponded>(client, {
      name: this.context,
      status: "responded",
    });
    this.settled = new Subscription<ConnectionSettled>(client, {
      name: this.context,
      status: "settled",
    });
    this.registerEventListeners();
  }

  get length(): number {
    return this.settled.length;
  }

  public async create(params?: ConnectionCreateParams): Promise<ConnectionSettled> {
    return new Promise(async (resolve, reject) => {
      const proposal = await this.propose(params);
      this.proposed.on("deleted", async (proposed: ConnectionProposed) => {
        if (proposed.topic !== proposal.topic) return;
        const responded: ConnectionResponded = await this.responded.get(proposal.topic);
        if (isConnectionFailed(responded.outcome)) {
          reject(new Error(responded.outcome.reason));
          this.responded.del(responded.topic, responded.outcome.reason);
        } else {
          resolve(responded.outcome);
          this.responded.del(responded.topic, "Connection Settled");
        }
      });
    });
  }

  public async respond(params: ConnectionRespondParams): Promise<ConnectionResponded> {
    const { approved, proposal } = params;
    if (approved) {
      try {
        assertType(proposal, "publicKey", "string");
        const keyPair = generateKeyPair();
        const relay = proposal.relay;
        const connection = await this.settle({
          relay,
          privateKey: keyPair.privateKey,
          publicKey: proposal.publicKey,
        });

        const responded: ConnectionResponded = {
          ...proposal,
          outcome: connection,
        };
        await this.responded.set(responded.topic, responded);
        return responded;
      } catch (e) {
        const reason = e.message;
        const responded: ConnectionResponded = {
          ...proposal,
          outcome: { reason },
        };
        await this.responded.set(responded.topic, responded);
        return responded;
      }
    } else {
      const responded: ConnectionResponded = {
        ...proposal,
        outcome: { reason: "Connection not approved" },
      };
      await this.responded.set(responded.topic, responded);
      return responded;
    }
  }

  public async delete(params: ConnectionDeleteParams): Promise<void> {
    await this.settled.del(params.topic, params.reason);
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

  protected async propose(params?: ConnectionProposeParams): Promise<ConnectionProposal> {
    const relay = params?.relay || this.client.relay.default;
    const proposed: ConnectionProposed = {
      relay,
      topic: await generateTopic(),
      keyPair: generateKeyPair(),
    };
    await this.proposed.set(proposed.topic, proposed);

    const proposal: ConnectionProposal = {
      relay: proposed.relay,
      topic: proposed.topic,
      publicKey: proposed.keyPair.publicKey,
    };
    return proposal;
  }

  protected async settle(params: ConnectionSettleParams): Promise<ConnectionSettled> {
    const symKey = deriveSharedKey(params.privateKey, params.publicKey);
    const connection: ConnectionSettled = {
      relay: params.relay,
      symKey,
      topic: await sha256(symKey),
    };
    await this.settled.set(connection.topic, connection);
    return connection;
  }

  protected async onResponse(messageEvent: MessageEvent): Promise<void> {
    const { topic, message } = messageEvent;
    const request = safeJsonParse(message);
    const proposed = await this.proposed.get(topic);
    try {
      assertType(request, "publicKey", "string");
      const connection = await this.settle({
        relay: request.relay,
        privateKey: proposed.keyPair.privateKey,
        publicKey: request.publicKey,
      });
      const response = formatJsonRpcResult(request.id, true);
      this.client.relay.publish(topic, JSON.stringify(response), proposed.relay);
      const responded: ConnectionResponded = {
        relay: proposed.relay,
        topic: proposed.topic,
        publicKey: proposed.keyPair.publicKey,
        outcome: connection,
      };
      await this.responded.set(topic, responded);
    } catch (e) {
      const reason = e.message;
      const response = formatJsonRpcError(request.id, reason);
      this.client.relay.publish(topic, JSON.stringify(response), proposed.relay);
      const responded: ConnectionResponded = {
        relay: proposed.relay,
        topic: proposed.topic,
        publicKey: proposed.keyPair.publicKey,
        outcome: { reason },
      };
      await this.responded.set(topic, responded);
    }
    await this.proposed.del(topic, "Proposal responded");
  }

  protected async onAcknowledge(messageEvent: MessageEvent): Promise<void> {
    const { topic, message } = messageEvent;
    const response = safeJsonParse(message);
    const responded = await this.responded.get(topic);
    if (response.error && !isConnectionFailed(responded.outcome)) {
      await this.settled.del(responded.outcome.topic, response.error.message);
    }
    await this.responded.del(topic, "Response acknowledged");
  }

  protected async onMessage(messageEvent: MessageEvent): Promise<void> {
    this.events.emit("message", messageEvent);
  }

  // ---------- Private ----------------------------------------------- //

  private registerEventListeners(): void {
    // Proposed Subscription Events
    this.proposed.on("message", (messageEvent: MessageEvent) => this.onResponse(messageEvent));
    this.proposed.on("created", (createdEvent: CreatedEvent<ConnectionProposed>) =>
      this.events.emit("connection_proposed", createdEvent.subscription),
    );
    // Responded Subscription Events
    this.responded.on("message", (messageEvent: MessageEvent) => this.onAcknowledge(messageEvent));
    this.responded.on("created", (createdEvent: CreatedEvent<ConnectionResponded>) => {
      const responded = createdEvent.subscription;
      this.events.emit("connect_responded", responded);
      const params = isConnectionFailed(responded.outcome)
        ? { reason: responded.outcome.reason }
        : { publicKey: responded.publicKey };
      const request = formatJsonRpcRequest("wc_respondConnection", params);
      this.client.relay.publish(responded.topic, JSON.stringify(request), responded.relay);
    });
    // Settled Subscription Events
    this.settled.on("message", (messageEvent: MessageEvent) => this.onMessage(messageEvent));
    this.settled.on("created", (connection: ConnectionSettled) =>
      this.events.emit("connection_settled", connection),
    );
    this.settled.on("deleted", (deletedEvent: DeletedEvent<ConnectionSettled>) => {
      const connection = deletedEvent.subscription;
      this.events.emit("connection_deleted", connection);
      const request = formatJsonRpcRequest("wc_deleteConnection", { reason: deletedEvent.reason });
      this.client.relay.publish(connection.topic, JSON.stringify(request), connection.relay);
    });
  }
}
