import { EventEmitter } from "events";

import { Subscription } from "./subscription";
import { IClient, ISession, SubscriptionEvent, SessionTypes } from "../../types";
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
  public proposed: Subscription<SessionTypes.Proposed>;
  public responded: Subscription<SessionTypes.Responded>;
  public settled: Subscription<SessionTypes.Settled>;

  protected events = new EventEmitter();

  protected context = CONNECTION_CONTEXT;

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

  get map(): KeyValue<SessionTypes.Settled> {
    return this.settled.map;
  }

  public async create(params?: SessionTypes.CreateParams): Promise<SessionTypes.Settled> {
    // TODO: implement respond
    return {} as SessionTypes.Settled;
  }

  public async respond(params: SessionTypes.RespondParams): Promise<SessionTypes.Responded> {
    // TODO: implement respond
    return {} as SessionTypes.Responded;
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

  protected async propose(params?: SessionTypes.ProposeParams): Promise<SessionTypes.Proposal> {
    // TODO: implement propose
    return {} as SessionTypes.Proposal;
  }

  protected async settle(params: SessionTypes.SettleParams): Promise<SessionTypes.Settled> {
    // TODO: implement settle
    return {} as SessionTypes.Settled;
  }

  protected async onResponse(messageEvent: SubscriptionEvent.Message): Promise<void> {
    // TODO: implement onResponse
  }

  protected async onAcknowledge(messageEvent: SubscriptionEvent.Message): Promise<void> {
    // TODO: implement onAcknowledge
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
        this.events.emit(SESSION_EVENTS.proposed, createdEvent.subscription),
    );
    // Responded Subscription Events
    this.responded.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onAcknowledge(messageEvent),
    );
    this.responded.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<SessionTypes.Responded>) =>
        this.events.emit(SESSION_EVENTS.responded, createdEvent.subscription),
    );
    // Settled Subscription Events
    this.settled.on(SUBSCRIPTION_EVENTS.message, (messageEvent: SubscriptionEvent.Message) =>
      this.onMessage(messageEvent),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.created,
      (createdEvent: SubscriptionEvent.Created<SessionTypes.Settled>) =>
        this.events.emit(SESSION_EVENTS.settled, createdEvent.subscription),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.updated,
      (updatedEvent: SubscriptionEvent.Updated<SessionTypes.Settled>) =>
        this.events.emit(SESSION_EVENTS.updated, updatedEvent.subscription),
    );
    this.settled.on(
      SUBSCRIPTION_EVENTS.deleted,
      (deletedEvent: SubscriptionEvent.Deleted<SessionTypes.Settled>) => {
        const session = deletedEvent.subscription;
        this.events.emit(SESSION_EVENTS.deleted, session);
        const request = formatJsonRpcRequest(SESSION_JSONRPC.delete, {
          reason: deletedEvent.reason,
        });
        this.client.relay.publish(session.topic, safeJsonStringify(request), session.relay);
      },
    );
  }
}
