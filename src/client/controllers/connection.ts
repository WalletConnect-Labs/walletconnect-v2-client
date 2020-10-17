import { EventEmitter } from "events";

import {
  IClient,
  IConnection,
  JsonRpcRequest,
  JsonRpcPayload,
  SubscriptionEvent,
  ConnectionTypes,
} from "../../types";
import {
  generateKeyPair,
  deriveSharedKey,
  sha256,
  formatJsonRpcRequest,
  assertType,
  generateRandomBytes32,
  formatJsonRpcError,
  formatJsonRpcResult,
  safeJsonParse,
  safeJsonStringify,
  isConnectionFailed,
  getConnectionMetadata,
  mapKeyValue,
} from "../../utils";
import {
  CONNECTION_CONTEXT,
  CONNECTION_EVENTS,
  CONNECTION_JSONRPC,
  CONNECTION_JSONRPC_AFTER_SETTLEMENT,
  CONNECTION_REASONS,
  CONNECTION_STATUS,
  SESSION_EVENTS,
  SESSION_JSONRPC,
  SESSION_JSONRPC_BEFORE_SETTLEMENT,
  SUBSCRIPTION_EVENTS,
} from "../constants";
import { KeyValue } from "./store";
import { Subscription } from "./subscription";

export class Connection extends IConnection {
  public proposed: Subscription<ConnectionTypes.Proposed>;
  public responded: Subscription<ConnectionTypes.Responded>;
  public settled: Subscription<ConnectionTypes.Settled>;

  public events = new EventEmitter();

  protected context = CONNECTION_CONTEXT;

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<ConnectionTypes.Proposed>(client, {
      name: this.context,
      status: CONNECTION_STATUS.proposed,
    });
    this.responded = new Subscription<ConnectionTypes.Responded>(client, {
      name: this.context,
      status: CONNECTION_STATUS.responded,
    });
    this.settled = new Subscription<ConnectionTypes.Settled>(client, {
      name: this.context,
      status: CONNECTION_STATUS.settled,
    });
    this.registerEventListeners();
  }

  public async init(): Promise<void> {
    await this.proposed.init();
    await this.responded.init();
    await this.settled.init();
  }

  get length(): number {
    return this.settled.length;
  }

  get entries(): KeyValue<ConnectionTypes.Settled> {
    return mapKeyValue(this.settled.entries, x => x.data);
  }

  public async create(params?: ConnectionTypes.CreateParams): Promise<ConnectionTypes.Settled> {
    return new Promise(async (resolve, reject) => {
      const proposal = await this.propose(params);
      this.proposed.on(SUBSCRIPTION_EVENTS.deleted, async (proposed: ConnectionTypes.Proposed) => {
        if (proposed.topic !== proposal.topic) return;
        const responded: ConnectionTypes.Responded = await this.responded.get(proposal.topic);
        if (isConnectionFailed(responded.outcome)) {
          await this.responded.del(responded.topic, responded.outcome.reason);
          reject(new Error(responded.outcome.reason));
        } else {
          const connection = await this.settled.get(responded.outcome.topic);
          await this.responded.del(responded.topic, CONNECTION_REASONS.settled);
          resolve(connection);
        }
      });
    });
  }

  public async respond(params: ConnectionTypes.RespondParams): Promise<ConnectionTypes.Responded> {
    const { approved, proposal } = params;
    if (approved) {
      try {
        assertType(proposal, "publicKey", "string");
        const keyPair = generateKeyPair();
        const relay = proposal.relay;
        const connection = await this.settle({
          relay,
          keyPair,
          peer: {
            publicKey: proposal.publicKey,
          },
        });

        const responded: ConnectionTypes.Responded = {
          ...proposal,
          outcome: connection,
        };
        await this.responded.set(responded.topic, responded.relay, responded);
        return responded;
      } catch (e) {
        const reason = e.message;
        const responded: ConnectionTypes.Responded = {
          ...proposal,
          outcome: { reason },
        };
        await this.responded.set(responded.topic, responded.relay, responded);
        return responded;
      }
    } else {
      const responded: ConnectionTypes.Responded = {
        ...proposal,
        outcome: { reason: CONNECTION_REASONS.not_approved },
      };
      await this.responded.set(responded.topic, responded.relay, responded);
      return responded;
    }
  }

  public async update(params: ConnectionTypes.UpdateParams): Promise<ConnectionTypes.Settled> {
    const connection = await this.settled.get(params.topic);
    const update = await this.handleUpdate(connection, params);
    const request = formatJsonRpcRequest(CONNECTION_JSONRPC.update, update);
    this.client.relay.publish(connection.topic, safeJsonStringify(request), connection.relay);
    return connection;
  }

  public async delete(params: ConnectionTypes.DeleteParams): Promise<void> {
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

  protected async propose(
    params?: ConnectionTypes.ProposeParams,
  ): Promise<ConnectionTypes.Proposal> {
    const relay = params?.relay || this.client.relay.default;
    const proposed: ConnectionTypes.Proposed = {
      relay,
      topic: generateRandomBytes32(),
      keyPair: generateKeyPair(),
    };
    await this.proposed.set(proposed.topic, relay, proposed);

    const proposal: ConnectionTypes.Proposal = {
      relay: proposed.relay,
      topic: proposed.topic,
      publicKey: proposed.keyPair.publicKey,
    };
    return proposal;
  }

  protected async settle(params: ConnectionTypes.SettleParams): Promise<ConnectionTypes.Settled> {
    const symKey = deriveSharedKey(params.keyPair.privateKey, params.peer.publicKey);
    const connection: ConnectionTypes.Settled = {
      relay: params.relay,
      topic: await sha256(symKey),
      symKey,
      keyPair: params.keyPair,
      peer: params.peer,
      state: {},
      rules: {
        state: {},
        jsonrpc: [...CONNECTION_JSONRPC_AFTER_SETTLEMENT, ...SESSION_JSONRPC_BEFORE_SETTLEMENT],
      },
    };
    await this.settled.set(connection.topic, connection.relay, connection);
    return connection;
  }

  protected async onResponse(messageEvent: SubscriptionEvent.Message): Promise<void> {
    const { topic, message } = messageEvent;
    const request = safeJsonParse(message) as JsonRpcRequest;
    const proposed = await this.proposed.get(topic);
    const { relay } = proposed;
    try {
      assertType(request, "publicKey", "string");
      const connection = await this.settle({
        relay: relay,
        keyPair: proposed.keyPair,
        peer: {
          publicKey: request.params.publicKey,
        },
      });
      const response = formatJsonRpcResult(request.id, true);
      this.client.relay.publish(topic, safeJsonStringify(response), relay);
      const responded: ConnectionTypes.Responded = {
        relay: relay,
        topic: proposed.topic,
        publicKey: proposed.keyPair.publicKey,
        outcome: connection,
      };
      await this.responded.set(topic, relay, responded);
    } catch (e) {
      const reason = e.message;
      const response = formatJsonRpcError(request.id, reason);
      this.client.relay.publish(topic, safeJsonStringify(response), relay);
      const responded: ConnectionTypes.Responded = {
        relay: relay,
        topic: proposed.topic,
        publicKey: proposed.keyPair.publicKey,
        outcome: { reason },
      };
      await this.responded.set(topic, relay, responded);
    }
    await this.proposed.del(topic, CONNECTION_REASONS.responded);
  }

  protected async onAcknowledge(messageEvent: SubscriptionEvent.Message): Promise<void> {
    const { topic, message } = messageEvent;
    const response = safeJsonParse(message);
    const responded = await this.responded.get(topic);
    if (response.error && !isConnectionFailed(responded.outcome)) {
      await this.settled.del(responded.outcome.topic, response.error.message);
    }
    await this.responded.del(topic, CONNECTION_REASONS.acknowledged);
  }

  protected async onMessage(messageEvent: SubscriptionEvent.Message): Promise<void> {
    const payload = safeJsonParse(messageEvent.message) as JsonRpcPayload;
    if (typeof (payload as JsonRpcRequest).method !== "undefined") {
      const request = payload as JsonRpcRequest;
      const connection = await this.settled.get(messageEvent.topic);
      if (!connection.rules.jsonrpc.includes(request.method)) {
        const response = formatJsonRpcError(
          request.id,
          `Unauthorized JSON-RPC Method Requested: ${request.method}`,
        );
        this.client.relay.publish(connection.topic, safeJsonStringify(response), connection.relay);
      }
      switch (request.method) {
        case CONNECTION_JSONRPC.update:
          await this.onUpdate(messageEvent);
          break;
        case SESSION_JSONRPC.propose:
          this.client.events.emit(SESSION_EVENTS.proposed, request);
          break;
        default:
          this.events.emit(CONNECTION_EVENTS.message, messageEvent);
          break;
      }
    }
  }

  protected async onUpdate(messageEvent: SubscriptionEvent.Message): Promise<void> {
    const request = safeJsonParse(messageEvent.message) as JsonRpcRequest;
    const connection = await this.settled.get(messageEvent.topic);
    try {
      await this.handleUpdate(connection, request.params, true);
      const response = formatJsonRpcResult(request.id, true);
      this.client.relay.publish(connection.topic, safeJsonStringify(response), connection.relay);
    } catch (e) {
      const response = formatJsonRpcError(request.id, e.message);
      this.client.relay.publish(connection.topic, safeJsonStringify(response), connection.relay);
    }
  }

  protected async handleUpdate(
    connection: ConnectionTypes.Settled,
    params: ConnectionTypes.UpdateParams,
    fromPeer?: boolean,
  ): Promise<ConnectionTypes.Update> {
    let update: ConnectionTypes.Update;
    if (typeof params.state !== "undefined") {
      const state = params.state as ConnectionTypes.State;
      const publicKey = fromPeer ? connection.peer.publicKey : connection.keyPair.publicKey;
      for (const key of Object.keys(state)) {
        if (!connection.rules.state[key][publicKey]) {
          throw new Error(`Unauthorized state update for key: ${key}`);
        }
        connection.state[key] = state[key];
      }
      update = { state };
    } else if (typeof params.metadata !== "undefined") {
      const metadata = params.metadata as ConnectionTypes.Metadata;
      if (fromPeer) {
        connection.peer.metadata = metadata;
      }
      update = { metadata };
    } else {
      throw new Error(`Invalid ${this.context} update request params`);
    }
    await this.settled.set(connection.topic, connection.relay, connection);
    return update;
  }

  // ---------- Private ----------------------------------------------- //

  private registerEventListeners(): void {
    // Proposed Subscription Events
    this.proposed.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onResponse(messageEvent),
    );
    this.proposed.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<ConnectionTypes.Proposed>) =>
        this.events.emit(CONNECTION_EVENTS.proposed, createdEvent.data),
    );
    // Responded Subscription Events
    this.responded.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onAcknowledge(messageEvent),
    );
    this.responded.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<ConnectionTypes.Responded>) => {
        const responded = createdEvent.data;
        this.events.emit("connect_responded", responded);
        const params = isConnectionFailed(responded.outcome)
          ? { reason: responded.outcome.reason }
          : { publicKey: responded.publicKey };
        const request = formatJsonRpcRequest(CONNECTION_JSONRPC.respond, params);
        this.client.relay.publish(responded.topic, safeJsonStringify(request), responded.relay);
      },
    );
    // Settled Subscription Events
    this.settled.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onMessage(messageEvent),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<ConnectionTypes.Settled>) => {
        this.events.emit(CONNECTION_EVENTS.settled, createdEvent.data);
        if (typeof createdEvent.data.peer.metadata === "undefined") {
          const metadata = getConnectionMetadata();
          if (!metadata) return;
          this.update({ topic: createdEvent.data.topic, metadata });
        }
      },
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.deleted,
      (deletedEvent: SubscriptionEvent.Deleted<ConnectionTypes.Settled>) => {
        const connection = deletedEvent.data;
        this.events.emit(CONNECTION_EVENTS.deleted, connection);
        const request = formatJsonRpcRequest(CONNECTION_JSONRPC.delete, {
          reason: deletedEvent.reason,
        });
        this.client.relay.publish(connection.topic, safeJsonStringify(request), connection.relay);
      },
    );
  }
}
