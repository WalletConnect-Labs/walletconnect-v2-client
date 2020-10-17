import { EventEmitter } from "events";

import { Subscription } from "./subscription";
import {
  IClient,
  ISession,
  SubscriptionEvent,
  SessionTypes,
  JsonRpcResult,
  JsonRpcError,
  JsonRpcResponse,
  JsonRpcRequest,
} from "../../types";
import {
  assertType,
  deriveSharedKey,
  formatJsonRpcRequest,
  formatJsonRpcResult,
  generateKeyPair,
  isSessionFailed,
  mapKeyValue,
  safeJsonParse,
  safeJsonStringify,
  sha256,
} from "../../utils";
import {
  SESSION_JSONRPC,
  SUBSCRIPTION_EVENTS,
  SESSION_EVENTS,
  SESSION_STATUS,
  SESSION_CONTEXT,
  SESSION_REASONS,
  SESSION_JSONRPC_AFTER_SETTLEMENT,
} from "../constants";
import { KeyValue } from "./store";
import { formatJsonRpcError } from "rpc-json-utils";

export class Session extends ISession {
  public proposed: Subscription<SessionTypes.Proposed>;
  public responded: Subscription<SessionTypes.Responded>;
  public settled: Subscription<SessionTypes.Settled>;

  public events = new EventEmitter();

  protected context = SESSION_CONTEXT;

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<SessionTypes.Proposed>(client, {
      name: this.context,
      status: SESSION_STATUS.proposed,
    });
    this.responded = new Subscription<SessionTypes.Responded>(client, {
      name: this.context,
      status: SESSION_STATUS.responded,
    });
    this.settled = new Subscription<SessionTypes.Settled>(client, {
      name: this.context,
      status: SESSION_STATUS.settled,
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

  get entries(): KeyValue<SessionTypes.Settled> {
    return mapKeyValue(this.settled.entries, x => x.data);
  }

  public async create(params: SessionTypes.CreateParams): Promise<SessionTypes.Settled> {
    return new Promise(async (resolve, reject) => {
      const proposal = await this.propose(params);
      this.proposed.on(SUBSCRIPTION_EVENTS.deleted, async (proposed: SessionTypes.Proposed) => {
        if (proposed.connection.topic !== proposal.connection.topic) return;
        const responded: SessionTypes.Responded = await this.responded.get(
          proposal.connection.topic,
        );
        if (isSessionFailed(responded.outcome)) {
          await this.responded.del(responded.connection.topic, responded.outcome.reason);
          reject(new Error(responded.outcome.reason));
        } else {
          const session = await this.settled.get(responded.outcome.topic);
          await this.responded.del(responded.connection.topic, SESSION_REASONS.settled);
          resolve(session);
        }
      });
    });
  }
  public async respond(params: SessionTypes.RespondParams): Promise<SessionTypes.Responded> {
    const { approved, proposal } = params;
    if (approved) {
      try {
        assertType(proposal, "publicKey", "string");
        const keyPair = generateKeyPair();
        const relay = proposal.relay;
        const session = await this.settle({
          relay,
          keyPair,
          peer: proposal.peer,
          state: params.state,
          rules: proposal.rules,
        });

        const responded: SessionTypes.Responded = {
          ...proposal,
          request: params.request,
          outcome: session,
        };
        await this.responded.set(responded.connection.topic, responded.connection.relay, responded);
        return responded;
      } catch (e) {
        const reason = e.message;
        const responded: SessionTypes.Responded = {
          ...proposal,
          request: params.request,
          outcome: { reason },
        };
        await this.responded.set(responded.connection.topic, responded.connection.relay, responded);
        return responded;
      }
    } else {
      const responded: SessionTypes.Responded = {
        ...proposal,
        request: params.request,
        outcome: { reason: SESSION_REASONS.not_approved },
      };
      await this.responded.set(responded.connection.topic, responded.connection.relay, responded);
      return responded;
    }
  }

  public async update(params: SessionTypes.UpdateParams): Promise<SessionTypes.Settled> {
    // TODO: implement respond
    return {} as SessionTypes.Settled;
  }

  public async delete(params: SessionTypes.DeleteParams): Promise<void> {
    this.settled.del(params.topic, params.reason);
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

  protected async propose(params: SessionTypes.ProposeParams): Promise<SessionTypes.Proposal> {
    const connection = await this.client.connection.settled.get(params.connection.topic);
    const keyPair = generateKeyPair();
    const proposal: SessionTypes.Proposal = {
      connection: {
        topic: connection.topic,
        relay: connection.relay,
      },
      relay: params.relay,
      peer: {
        publicKey: keyPair.publicKey,
        metadata: params.metadata,
      },
      stateParams: params.stateParams,
      rules: params.rules,
    };
    const proposed: SessionTypes.Proposed = {
      connection: {
        topic: connection.topic,
        relay: connection.relay,
      },
      keyPair,
      proposal,
    };
    const request = formatJsonRpcRequest(SESSION_JSONRPC.propose, proposal);
    this.client.relay.publish(
      proposed.connection.topic,
      safeJsonStringify(request),
      proposed.connection.relay,
    );
    this.proposed.set(proposed.connection.topic, proposed.connection.relay, proposed);
    return proposal;
  }

  protected async settle(params: SessionTypes.SettleParams): Promise<SessionTypes.Settled> {
    const symKey = deriveSharedKey(params.keyPair.privateKey, params.peer.publicKey);
    const session: SessionTypes.Settled = {
      relay: params.relay,
      topic: await sha256(symKey),
      symKey,
      keyPair: params.keyPair,
      peer: params.peer,
      state: params.state,
      rules: {
        ...params.rules,
        jsonrpc: [...SESSION_JSONRPC_AFTER_SETTLEMENT, ...params.rules.jsonrpc],
      },
    };
    await this.settled.set(session.topic, session.relay, session);
    return session;
  }

  protected async onResponse(messageEvent: SubscriptionEvent.Message): Promise<void> {
    const { topic, message } = messageEvent;
    const response = safeJsonParse(message) as JsonRpcResponse;
    if (typeof (response as JsonRpcResult).result !== "undefined") {
      const result = (response as JsonRpcResult).result;
      const proposed = await this.proposed.get(topic);
      const { relay } = proposed.connection;
      assertType(response, "publicKey", "string");
      const session = await this.settle({
        relay,
        keyPair: proposed.keyPair,
        peer: proposed.proposal.peer,
        state: result.state,
        rules: proposed.proposal.rules,
      });
      const request = formatJsonRpcRequest(SESSION_JSONRPC.acknowledge, {
        topic: proposed.connection.topic,
      });
      this.client.relay.publish(topic, safeJsonStringify(request), relay);
    }

    await this.proposed.del(topic, SESSION_REASONS.responded);
  }

  protected async onAcknowledge(messageEvent: SubscriptionEvent.Message): Promise<void> {
    await this.responded.del(messageEvent.topic, SESSION_REASONS.acknowledged);
  }

  protected async onMessage(messageEvent: SubscriptionEvent.Message): Promise<void> {
    this.events.emit(SESSION_EVENTS.message, messageEvent);
  }

  protected async onUpdate(messageEvent: SubscriptionEvent.Message): Promise<void> {
    // TODO: implement onUpdate
  }

  protected async handleUpdate(
    session: SessionTypes.Settled,
    params: SessionTypes.UpdateParams,
    fromPeer?: boolean,
  ): Promise<SessionTypes.Update> {
    // TODO: implement handleUpdate
    return {} as SessionTypes.Update;
  }

  // ---------- Private ----------------------------------------------- //

  private registerEventListeners(): void {
    // Proposed Subscription Events
    this.proposed.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onResponse(messageEvent),
    );
    this.proposed.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<SessionTypes.Proposed>) =>
        this.events.emit(SESSION_EVENTS.proposed, createdEvent.data),
    );
    // Responded Subscription Events
    this.responded.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onAcknowledge(messageEvent),
    );
    this.responded.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<SessionTypes.Responded>) => {
        const responded = createdEvent.data;
        this.events.emit(SESSION_EVENTS.responded, responded);
        let response: JsonRpcResponse;
        if (isSessionFailed(responded.outcome)) {
          response = formatJsonRpcError(responded.request.id, responded.outcome.reason);
        } else {
          response = formatJsonRpcResult(responded.request.id, responded.outcome);
        }
        this.client.relay.publish(
          responded.connection.topic,
          safeJsonStringify(response),
          responded.connection.relay,
        );
      },
    );
    // Settled Subscription Events
    this.settled.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onMessage(messageEvent),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<SessionTypes.Settled>) =>
        this.events.emit(SESSION_EVENTS.settled, createdEvent.data),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.updated,
      (updatedEvent: SubscriptionEvent.Updated<SessionTypes.Settled>) =>
        this.events.emit(SESSION_EVENTS.updated, updatedEvent.data),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.deleted,
      (deletedEvent: SubscriptionEvent.Deleted<SessionTypes.Settled>) => {
        const session = deletedEvent.data;
        this.events.emit(SESSION_EVENTS.deleted, session);
        const request = formatJsonRpcRequest(SESSION_JSONRPC.delete, {
          reason: deletedEvent.reason,
        });
        this.client.relay.publish(session.topic, safeJsonStringify(request), session.relay);
      },
    );
  }
}
