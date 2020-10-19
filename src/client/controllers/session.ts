import { EventEmitter } from "events";

import { Subscription } from "./subscription";
import {
  IClient,
  ISession,
  JsonRpcPayload,
  JsonRpcRequest,
  SessionTypes,
  SubscriptionEvent,
} from "../../types";
import {
  deriveSharedKey,
  formatJsonRpcError,
  formatJsonRpcRequest,
  formatJsonRpcResult,
  generateKeyPair,
  generateRandomBytes32,
  isJsonRpcRequest,
  isSessionFailed,
  mapEntries,
  sha256,
} from "../../utils";
import {
  SESSION_CONTEXT,
  SESSION_EVENTS,
  SESSION_JSONRPC_AFTER_SETTLEMENT,
  SESSION_JSONRPC,
  SESSION_REASONS,
  SESSION_STATUS,
  SUBSCRIPTION_EVENTS,
} from "../constants";

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
      encrypted: true,
    });
    this.responded = new Subscription<SessionTypes.Responded>(client, {
      name: this.context,
      status: SESSION_STATUS.responded,
      encrypted: true,
    });
    this.settled = new Subscription<SessionTypes.Settled>(client, {
      name: this.context,
      status: SESSION_STATUS.settled,
      encrypted: true,
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

  get entries(): Record<string, SessionTypes.Settled> {
    return mapEntries(this.settled.entries, x => x.data);
  }

  public async create(params: SessionTypes.CreateParams): Promise<SessionTypes.Settled> {
    return new Promise(async (resolve, reject) => {
      const proposal = await this.propose(params);
      this.proposed.on(SUBSCRIPTION_EVENTS.deleted, async (proposed: SessionTypes.Proposed) => {
        if (proposed.topic !== proposal.topic) return;
        const responded: SessionTypes.Responded = await this.responded.get(proposal.topic);
        if (isSessionFailed(responded.outcome)) {
          await this.responded.delete(responded.topic, responded.outcome.reason);
          reject(new Error(responded.outcome.reason));
        } else {
          const session = await this.settled.get(responded.outcome.topic);
          await this.responded.delete(responded.topic, SESSION_REASONS.settled);
          resolve(session);
        }
      });
    });
  }

  public async respond(params: SessionTypes.RespondParams): Promise<SessionTypes.Responded> {
    const { approved, proposal } = params;
    if (approved) {
      try {
        const keyPair = generateKeyPair();
        const relay = proposal.relay;
        const proposer = proposal.peer.publicKey;
        const responder = keyPair.publicKey;
        const session = await this.settle({
          relay,
          keyPair,
          peer: proposal.peer,
          state: params.state,
          rules: {
            state: {
              accounts: {
                [proposer]: proposal.ruleParams.state.accounts.proposer,
                [responder]: proposal.ruleParams.state.accounts.responder,
              },
            },
            jsonrpc: proposal.ruleParams.jsonrpc,
          },
        });

        const responded: SessionTypes.Responded = {
          ...proposal,
          outcome: {
            topic: session.topic,
            relay: session.relay,
            state: session.state,
            publicKey: session.keyPair.publicKey,
          },
        };
        await this.responded.set(responded.topic, responded, { relay: responded.relay });
        return responded;
      } catch (e) {
        const reason = e.payload;
        const responded: SessionTypes.Responded = {
          ...proposal,
          outcome: { reason },
        };
        await this.responded.set(responded.topic, responded, { relay: responded.relay });
        return responded;
      }
    } else {
      const responded: SessionTypes.Responded = {
        ...proposal,
        outcome: { reason: SESSION_REASONS.not_approved },
      };
      await this.responded.set(responded.topic, responded, { relay: responded.relay });
      return responded;
    }
  }

  public async update(params: SessionTypes.UpdateParams): Promise<SessionTypes.Settled> {
    // TODO: implement respond
    return {} as SessionTypes.Settled;
  }

  public async delete(params: SessionTypes.DeleteParams): Promise<void> {
    this.settled.delete(params.topic, params.reason);
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
      topic: generateRandomBytes32(),
      relay: params.relay,
      peer: {
        publicKey: keyPair.publicKey,
        metadata: params.metadata,
      },
      stateParams: params.stateParams,
      ruleParams: params.ruleParams,
      connection: {
        topic: connection.topic,
      },
    };
    const proposed: SessionTypes.Proposed = {
      topic: proposal.topic,
      relay: proposal.relay,
      keyPair,
      proposal,
    };
    const request = formatJsonRpcRequest(SESSION_JSONRPC.propose, proposal);

    this.client.relay.publish(connection.topic, request, {
      relay: connection.relay,
      encrypt: {
        sharedKey: connection.sharedKey,
        publicKey: connection.keyPair.publicKey,
      },
    });
    this.proposed.set(proposed.topic, proposed, {
      relay: proposed.relay,
      decrypt: {
        sharedKey: connection.sharedKey,
        publicKey: connection.peer.publicKey,
      },
    });
    return proposal;
  }

  protected async settle(params: SessionTypes.SettleParams): Promise<SessionTypes.Settled> {
    const sharedKey = deriveSharedKey(params.keyPair.privateKey, params.peer.publicKey);
    const session: SessionTypes.Settled = {
      relay: params.relay,
      topic: await sha256(sharedKey),
      sharedKey,
      keyPair: params.keyPair,
      peer: params.peer,
      state: params.state,
      rules: {
        ...params.rules,
        jsonrpc: [...SESSION_JSONRPC_AFTER_SETTLEMENT, ...params.rules.jsonrpc],
      },
    };
    await this.settled.set(session.topic, session, {
      relay: session.relay,
      decrypt: {
        sharedKey: session.sharedKey,
        publicKey: session.peer.publicKey,
      },
    });
    return session;
  }

  protected async onResponse(payloadEvent: SubscriptionEvent.Payload): Promise<void> {
    const { topic, payload } = payloadEvent;
    const request = payload as JsonRpcRequest;
    const outcome = request.params as SessionTypes.Outcome;
    const proposed = await this.proposed.get(topic);
    const connection = await this.client.connection.settled.get(proposed.proposal.connection.topic);
    const { relay } = proposed;
    if (!isSessionFailed(outcome)) {
      try {
        const proposer = proposed.keyPair.publicKey;
        const responder = outcome.publicKey;
        const session = await this.settle({
          relay,
          keyPair: proposed.keyPair,
          peer: proposed.proposal.peer,
          state: outcome.state,
          rules: {
            state: {
              accounts: {
                [proposer]: proposed.proposal.ruleParams.state.accounts.proposer,
                [responder]: proposed.proposal.ruleParams.state.accounts.responder,
              },
            },
            jsonrpc: proposed.proposal.ruleParams.jsonrpc,
          },
        });
        const response = formatJsonRpcResult(request.id, true);
        this.client.relay.publish(topic, response, {
          relay,
          encrypt: {
            sharedKey: connection.sharedKey,
            publicKey: connection.keyPair.publicKey,
          },
        });
        const responded: SessionTypes.Responded = {
          relay: relay,
          topic: proposed.topic,
          peer: proposed.proposal.peer,
          connection: proposed.proposal.connection,
          outcome: {
            topic: session.topic,
            relay: session.relay,
            state: session.state,
            publicKey: session.keyPair.publicKey,
          },
        };
        await this.responded.set(topic, responded, {
          relay,
          decrypt: {
            sharedKey: connection.sharedKey,
            publicKey: connection.peer.publicKey,
          },
        });
      } catch (e) {
        const reason = e.payload;
        const response = formatJsonRpcError(request.id, reason);
        this.client.relay.publish(topic, response, {
          relay,
          encrypt: {
            sharedKey: connection.sharedKey,
            publicKey: connection.keyPair.publicKey,
          },
        });
        const responded: SessionTypes.Responded = {
          relay: relay,
          topic: proposed.topic,
          peer: proposed.proposal.peer,
          connection: proposed.proposal.connection,
          outcome: { reason },
        };
        await this.responded.set(topic, responded, {
          relay,
          decrypt: {
            sharedKey: connection.sharedKey,
            publicKey: connection.peer.publicKey,
          },
        });
      }
    } else {
      const reason = outcome.reason;
      const response = formatJsonRpcError(request.id, reason);
      this.client.relay.publish(topic, response, {
        relay,
        encrypt: {
          sharedKey: connection.sharedKey,
          publicKey: connection.keyPair.publicKey,
        },
      });
      const responded: SessionTypes.Responded = {
        relay: relay,
        topic: proposed.topic,
        peer: proposed.proposal.peer,
        connection: proposed.proposal.connection,
        outcome: { reason },
      };
      await this.responded.set(topic, responded, {
        relay,
        decrypt: {
          sharedKey: connection.sharedKey,
          publicKey: connection.peer.publicKey,
        },
      });
    }
    await this.proposed.delete(topic, SESSION_REASONS.responded);
  }

  protected async onAcknowledge(payloadEvent: SubscriptionEvent.Payload): Promise<void> {
    await this.responded.delete(payloadEvent.topic, SESSION_REASONS.acknowledged);
  }

  protected async onMessage(payloadEvent: SubscriptionEvent.Payload): Promise<void> {
    const payload = payloadEvent.payload as JsonRpcPayload;
    if (isJsonRpcRequest(payload)) {
      const request = payload as JsonRpcRequest;
      const session = await this.settled.get(payloadEvent.topic);
      if (!session.rules.jsonrpc.includes(request.method)) {
        const response = formatJsonRpcError(
          request.id,
          `Unauthorized JSON-RPC Method Requested: ${request.method}`,
        );
        this.client.relay.publish(session.topic, response, {
          relay: session.relay,
          encrypt: {
            sharedKey: session.sharedKey,
            publicKey: session.keyPair.publicKey,
          },
        });
      }
      switch (request.method) {
        case SESSION_JSONRPC.update:
          await this.onUpdate(payloadEvent);
          break;
        case SESSION_JSONRPC.delete:
          await this.settled.delete(session.topic, request.params.reason);
          break;
        default:
          this.events.emit(SESSION_EVENTS.payload, payloadEvent.payload);
          break;
      }
    } else {
      this.events.emit(SESSION_EVENTS.payload, payloadEvent.payload);
    }
  }

  protected async onUpdate(payloadEvent: SubscriptionEvent.Payload): Promise<void> {
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
    this.proposed.on(SUBSCRIPTION_EVENTS.payload, (payloadEvent: SubscriptionEvent.Payload) =>
      this.onResponse(payloadEvent),
    );
    this.proposed.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<SessionTypes.Proposed>) => {
        const proposed = createdEvent.data;
        this.events.emit(SESSION_EVENTS.proposed, proposed);
      },
    );
    // Responded Subscription Events
    this.responded.on(SUBSCRIPTION_EVENTS.payload, (payloadEvent: SubscriptionEvent.Payload) =>
      this.onAcknowledge(payloadEvent),
    );
    this.responded.on(
      SUBSCRIPTION_EVENTS.created,
      async (createdEvent: SubscriptionEvent.Created<SessionTypes.Responded>) => {
        const responded = createdEvent.data;
        this.events.emit(SESSION_EVENTS.responded, responded);
        const params = isSessionFailed(responded.outcome)
          ? { reason: responded.outcome.reason }
          : { publicKey: responded.outcome.publicKey };
        const connection = await this.client.connection.settled.get(responded.connection.topic);
        const request = formatJsonRpcRequest(SESSION_JSONRPC.respond, params);
        this.client.relay.publish(responded.topic, request, {
          relay: responded.relay,
          encrypt: {
            sharedKey: connection.sharedKey,
            publicKey: connection.keyPair.publicKey,
          },
        });
      },
    );
    // Settled Subscription Events
    this.settled.on(SUBSCRIPTION_EVENTS.payload, (payloadEvent: SubscriptionEvent.Payload) =>
      this.onMessage(payloadEvent),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<SessionTypes.Settled>) => {
        const session = createdEvent.data;
        this.events.emit(SESSION_EVENTS.settled, session);
      },
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.updated,
      (updatedEvent: SubscriptionEvent.Updated<SessionTypes.Settled>) => {
        const connection = updatedEvent.data;
        this.events.emit(SESSION_EVENTS.updated, connection);
      },
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.deleted,
      (deletedEvent: SubscriptionEvent.Deleted<SessionTypes.Settled>) => {
        const session = deletedEvent.data;
        this.events.emit(SESSION_EVENTS.deleted, session);
        const request = formatJsonRpcRequest(SESSION_JSONRPC.delete, {
          reason: deletedEvent.reason,
        });
        this.client.relay.publish(session.topic, request, { relay: session.relay });
      },
    );
  }
}
