import { EventEmitter } from "events";

import { Subscription } from "./subscription";
import { IClient, SessionProposed, SessionCreated, IProtocol, ISession } from "../../types";

export class Session extends ISession {
  public proposed: Subscription<SessionProposed>;
  public created: Subscription<SessionCreated>;

  private events = new EventEmitter();

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<SessionProposed>(client, "proposed");
    this.proposed.on("message", ({ topic, message }) => this.onResponse(topic, message));
    this.created = new Subscription<SessionCreated>(client, "created");
    this.created.on("message", ({ topic, message }) => this.onMessage(topic, message));
  }
  public async propose(): Promise<void> {
    // TODO: implement propose
  }

  public async respond(): Promise<void> {
    // TODO: implement respond
  }

  public async create(): Promise<void> {
    // TODO: implemen createt
  }

  public async delete(): Promise<void> {
    // TODO: implemen deletet
  }

  // ---------- Protected ----------------------------------------------- //

  protected async onResponse(topic: string, message: string): Promise<void> {
    // TODO: implement onResponse
  }

  protected async onMessage(topic: string, message: string) {
    this.events.emit("message", { topic, message });
  }
}
