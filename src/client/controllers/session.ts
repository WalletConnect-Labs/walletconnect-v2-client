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

  public async onResponse(request: any): Promise<void> {
    // TODO: implement onResponse
  }

  public async onMessage(message: any): Promise<void> {
    // TODO: implement onMessage
  }
}
