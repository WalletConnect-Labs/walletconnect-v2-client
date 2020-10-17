import { EventEmitter } from "events";

import { Subscription } from "./subscription";
import {
  IClient,
  ISession,
  SessionProposal,
  SessionProposed,
  SessionResponded,
  SessionSettled,
  SessionProposeParams,
  SessionRespondParams,
  SessionSettleParams,
  SessionDeleteParams,
  MessageEvent,
  SessionCreateParams,
  DeletedEvent,
  CreatedEvent,
  SessionUpdateParams,
  UpdatedEvent,
  SessionUpdate,
} from "../../types";
import { formatJsonRpcRequest, safeJsonStringify } from "../../utils";
import {
  SESSION_JSONRPC,
  SUBSCRIPTION_EVENTS,
  SESSION_EVENTS,
  SESSION_STATUS,
  CONNECTION_CONTEXT,
} from "../constants";
import { KeyValue } from "./store";

export class Session extends ISession {
  public proposed: Subscription<SessionProposed>;
  public responded: Subscription<SessionResponded>;
  public settled: Subscription<SessionSettled>;

  protected events = new EventEmitter();

  protected context = CONNECTION_CONTEXT;

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<SessionProposed>(client, {
      name: this.context,
      status: SESSION_STATUS.proposed,
    });
    this.responded = new Subscription<SessionResponded>(client, {
      name: this.context,
      status: SESSION_STATUS.responded,
    });
    this.settled = new Subscription<SessionSettled>(client, {
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

  get map(): KeyValue<SessionSettled> {
    return this.settled.map;
  }

  public async create(params?: SessionCreateParams): Promise<SessionSettled> {
    // TODO: implement respond
    return {} as SessionSettled;
  }

  public async respond(params: SessionRespondParams): Promise<SessionResponded> {
    // TODO: implement respond
    return {} as SessionResponded;
  }

  public async update(params: SessionUpdateParams): Promise<SessionSettled> {
    // TODO: implement respond
    return {} as SessionSettled;
  }

  public async delete(params: SessionDeleteParams): Promise<void> {
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

  protected async propose(params?: SessionProposeParams): Promise<SessionProposal> {
    // TODO: implement propose
    return {} as SessionProposal;
  }

  protected async settle(params: SessionSettleParams): Promise<SessionSettled> {
    // TODO: implement settle
    return {} as SessionSettled;
  }

  protected async onResponse(messageEvent: MessageEvent): Promise<void> {
    // TODO: implement onResponse
  }

  protected async onAcknowledge(messageEvent: MessageEvent): Promise<void> {
    // TODO: implement onAcknowledge
  }

  protected async onMessage(messageEvent: MessageEvent): Promise<void> {
    this.events.emit(SESSION_EVENTS.message, messageEvent);
  }

  protected async onUpdate(messageEvent: MessageEvent): Promise<void> {
    // TODO: implement onUpdate
  }

  protected async handleUpdate(
    session: SessionSettled,
    params: SessionUpdateParams,
  ): Promise<SessionUpdate> {
    // TODO: implement handleUpdate
    return {} as SessionUpdate;
  }

  // ---------- Private ----------------------------------------------- //

  private registerEventListeners(): void {
    // Proposed Subscription Events
    this.proposed.on(SUBSCRIPTION_EVENTS.message, (messageEvent: MessageEvent) =>
      this.onResponse(messageEvent),
    );
    this.proposed.on(SUBSCRIPTION_EVENTS.created, (createdEvent: CreatedEvent<SessionProposed>) =>
      this.events.emit(SESSION_EVENTS.proposed, createdEvent.subscription),
    );
    // Responded Subscription Events
    this.responded.on(SUBSCRIPTION_EVENTS.message, (messageEvent: MessageEvent) =>
      this.onAcknowledge(messageEvent),
    );
    this.responded.on(SUBSCRIPTION_EVENTS.created, (createdEvent: CreatedEvent<SessionResponded>) =>
      this.events.emit(SESSION_EVENTS.responded, createdEvent.subscription),
    );
    // Settled Subscription Events
    this.settled.on(SUBSCRIPTION_EVENTS.message, (messageEvent: MessageEvent) =>
      this.onMessage(messageEvent),
    );
    this.settled.on(SUBSCRIPTION_EVENTS.created, (createdEvent: CreatedEvent<SessionSettled>) =>
      this.events.emit(SESSION_EVENTS.settled, createdEvent.subscription),
    );
    this.settled.on(SUBSCRIPTION_EVENTS.updated, (updatedEvent: UpdatedEvent<SessionSettled>) =>
      this.events.emit(SESSION_EVENTS.updated, updatedEvent.subscription),
    );
    this.settled.on(SUBSCRIPTION_EVENTS.deleted, (deletedEvent: DeletedEvent<SessionSettled>) => {
      const session = deletedEvent.subscription;
      this.events.emit(SESSION_EVENTS.deleted, session);
      const request = formatJsonRpcRequest(SESSION_JSONRPC.delete, { reason: deletedEvent.reason });
      this.client.relay.publish(session.topic, safeJsonStringify(request), session.relay);
    });
  }
}
