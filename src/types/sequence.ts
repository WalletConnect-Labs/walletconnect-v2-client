import { IClient } from "./client";
import { IEvents, MessageEvent } from "./events";
import { ISubscription } from "./subscription";

export abstract class ISequence extends IEvents {
  // proposed subscriptions
  public abstract proposed: ISubscription<any>;
  // responded subscriptions
  public abstract responded: ISubscription<any>;
  // created subscriptions
  public abstract created: ISubscription<any>;

  protected abstract context: string;

  constructor(public client: IClient) {
    super();
  }

  // event methods
  public abstract on(event: string, listener: any): void;
  public abstract once(event: string, listener: any): void;
  public abstract off(event: string, listener: any): void;

  // called by the initiator
  public abstract propose(params?: any): Promise<any>;
  // called by the responder
  public abstract respond(params?: any): Promise<any>;
  // called by both after successful connection
  public abstract create(params?: any): Promise<any>;
  // called by either when disconnecting
  public abstract delete(params?: any): Promise<any>;

  // ---------- Protected ----------------------------------------------- //

  // callback for proposed subscriptions
  protected abstract onResponse(messageEvent: MessageEvent): Promise<any>;
  // callback for responded subscriptions
  protected abstract onAcknowledge(messageEvent: MessageEvent): Promise<any>;
  // callback for created subscriptions
  protected abstract onMessage(messageEvent: MessageEvent): Promise<any>;
}