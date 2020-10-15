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
} from "../../types";

export class Session extends ISession {
  public proposed: Subscription<SessionProposed>;
  public responded: Subscription<SessionResponded>;
  public created: Subscription<SessionCreated>;

  protected events = new EventEmitter();

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<SessionProposed>(client, "proposed");
    this.proposed.on("message", ({ topic, message }) => this.onResponse(topic, message));
    this.responded = new Subscription<SessionResponded>(client, "responded");
    this.responded.on("message", ({ topic, message }) => this.onAcknowledge(topic, message));
    this.created = new Subscription<SessionCreated>(client, "created");
    this.created.on("message", ({ topic, message }) => this.onMessage(topic, message));
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
    // TODO: implement onResponse
  }

  protected async onAcknowledge(topic: string, message: string): Promise<void> {
    // TODO: implement onAcknowledge
  }

  protected async onMessage(topic: string, message: string) {
    this.events.emit("message", { topic, message });
  }
}
