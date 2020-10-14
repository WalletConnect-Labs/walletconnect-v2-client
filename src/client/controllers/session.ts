import { EventEmitter } from "events";

import { Subscription } from "./subscription";
import { IClient, SessionProposed, SessionCreated, IProtocol, ISession } from "../../types";

export class Session implements ISession {
  public proposed: Subscription<SessionProposed>;
  public created: Subscription<SessionCreated>;

  private events = new EventEmitter();

  constructor(public client: IClient) {
    this.proposed = new Subscription<SessionProposed>(client, "proposed");
    this.proposed.on("payload", (payload: any) => this.onResponse(payload));
    this.created = new Subscription<SessionCreated>(client, "created");
    this.created.on("payload", (payload: any) => this.onMessage(payload));
  }
  public async propose(): Promise<void> {}

  public async respond(): Promise<void> {}

  public async create(): Promise<void> {}

  public async delete(): Promise<void> {}

  public async onResponse(payload: any): Promise<void> {}

  public async onMessage(payload: any): Promise<void> {}
}
