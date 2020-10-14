import { EventEmitter } from "events";

import { SubscriptionController } from "./subscription";
import {
  IClient,
  SessionProposed,
  SessionCreated,
  IProtocolController,
  ISessionController,
} from "../../types";

export class SessionController implements ISessionController {
  public proposed: SubscriptionController<SessionProposed>;
  public created: SubscriptionController<SessionCreated>;

  private events = new EventEmitter();

  constructor(public client: IClient) {
    this.proposed = new SubscriptionController<SessionProposed>(client, "proposed");
    this.proposed.on("payload", (payload: any) => this.onResponse(payload));
    this.created = new SubscriptionController<SessionCreated>(client, "created");
    this.created.on("payload", (payload: any) => this.onMessage(payload));
  }
  public async propose(): Promise<void> {}

  public async respond(): Promise<void> {}

  public async create(): Promise<void> {}

  public async delete(): Promise<void> {}

  public async onResponse(payload: any): Promise<void> {}

  public async onMessage(payload: any): Promise<void> {}
}
