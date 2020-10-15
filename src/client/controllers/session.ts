import { EventEmitter } from "events";

import { Subscription } from "./subscription";
import {
  IClient,
  ISession,
  SessionProposal,
  SessionProposed,
  SessionResponded,
  SessionCreated,
  SessionProposeParams,
  SessionRespondParams,
  SessionCreateParams,
  SessionDeleteParams,
  Message,
} from "../../types";
import { formatJsonRpcRequest } from "../../utils";

export class Session extends ISession {
  public proposed: Subscription<SessionProposed>;
  public responded: Subscription<SessionResponded>;
  public created: Subscription<SessionCreated>;

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
    this.created = new Subscription<SessionCreated>(client, {
      name: this.context,
      status: "created",
    });
    this.registerEventListeners();
  }

  public async propose(params?: SessionProposeParams): Promise<SessionProposal> {
    // TODO: implement propose
    return {} as SessionProposal;
  }

  public async respond(params: SessionRespondParams): Promise<SessionResponded> {
    // TODO: implement respond
    return {} as SessionResponded;
  }

  public async create(params: SessionCreateParams): Promise<SessionCreated> {
    // TODO: implement create
    return {} as SessionCreated;
  }

  public async delete(params: SessionDeleteParams): Promise<void> {
    const session = await this.created.get(params.topic);
    const request = formatJsonRpcRequest("wc_deleteSession", { reason: params.reason });
    this.client.relay.publish(session.topic, JSON.stringify(request), session.relay);
    this.created.del(params.topic);
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

  protected async onResponse(messageEvent: Message): Promise<void> {
    // TODO: implement onResponse
  }

  protected async onAcknowledge(messageEvent: Message): Promise<void> {
    // TODO: implement onAcknowledge
  }

  protected async onMessage(messageEvent: Message) {
    this.events.emit("message", messageEvent);
  }

  // ---------- Private ----------------------------------------------- //

  private registerEventListeners(): void {
    this.proposed.on("message", (messageEvent: Message) => this.onResponse(messageEvent));
    this.proposed.on("created", (session: SessionProposed) =>
      this.events.emit("session_proposed", session),
    );
    this.responded.on("message", (messageEvent: Message) => this.onAcknowledge(messageEvent));
    this.responded.on("created", (session: SessionResponded) =>
      this.events.emit("session_responded", session),
    );
    this.created.on("message", (messageEvent: Message) => this.onMessage(messageEvent));
    this.created.on("created", (session: SessionCreated) =>
      this.events.emit("session_created", session),
    );
    this.created.on("deleted", (session: SessionCreated) =>
      this.events.emit("session_deleted", session),
    );
  }
}
