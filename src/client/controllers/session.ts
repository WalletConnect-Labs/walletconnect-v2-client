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
} from "../../types";
import { formatJsonRpcRequest } from "../../utils";

export class Session extends ISession {
  public proposed: Subscription<SessionProposed>;
  public responded: Subscription<SessionResponded>;
  public settled: Subscription<SessionSettled>;

  protected events = new EventEmitter();

  protected context = "session";

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<SessionProposed>(client, {
      name: this.context,
      status: "proposed",
    });
    this.responded = new Subscription<SessionResponded>(client, {
      name: this.context,
      status: "responded",
    });
    this.settled = new Subscription<SessionSettled>(client, {
      name: this.context,
      status: "settled",
    });
    this.registerEventListeners();
  }

  get length(): number {
    return this.settled.length;
  }

  public async create(params?: SessionCreateParams): Promise<SessionSettled> {
    // TODO: implement respond
    return {} as SessionSettled;
  }

  public async respond(params: SessionRespondParams): Promise<SessionResponded> {
    // TODO: implement respond
    return {} as SessionResponded;
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

  protected async onMessage(messageEvent: MessageEvent) {
    this.events.emit("message", messageEvent);
  }

  // ---------- Private ----------------------------------------------- //

  private registerEventListeners(): void {
    // Proposed Subscription Events
    this.proposed.on("message", (messageEvent: MessageEvent) => this.onResponse(messageEvent));
    this.proposed.on("created", (createdEvent: CreatedEvent<SessionProposed>) =>
      this.events.emit("session_proposed", createdEvent.subscription),
    );
    // Responded Subscription Events
    this.responded.on("message", (messageEvent: MessageEvent) => this.onAcknowledge(messageEvent));
    this.responded.on("created", (createdEvent: CreatedEvent<SessionResponded>) =>
      this.events.emit("session_responded", createdEvent.subscription),
    );
    // Settled Subscription Events
    this.settled.on("message", (messageEvent: MessageEvent) => this.onMessage(messageEvent));
    this.settled.on("created", (createdEvent: CreatedEvent<SessionSettled>) =>
      this.events.emit("session_settled", createdEvent.subscription),
    );
    this.settled.on("deleted", (deletedEvent: DeletedEvent<SessionSettled>) => {
      const session = deletedEvent.subscription;
      this.events.emit("session_deleted", session);
      const request = formatJsonRpcRequest("wc_deleteConnection", { reason: deletedEvent.reason });
      this.client.relay.publish(session.topic, JSON.stringify(request), session.relay);
    });
  }
}
