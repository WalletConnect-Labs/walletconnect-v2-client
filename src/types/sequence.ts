import { IClient } from "./client";
import { IEvents, MessageEvent } from "./events";
import { ISubscription } from "./subscription";

export abstract class ISequence extends IEvents {
  // proposed subscriptions
  public abstract proposed: ISubscription<any>;
  // responded subscriptions
  public abstract responded: ISubscription<any>;
  // settled subscriptions
  public abstract settled: ISubscription<any>;
  // returns settled connections length
  public abstract readonly length: number;
  // describes sequence context
  protected abstract context: string;

  constructor(public client: IClient) {
    super();
  }

  // event methods
  public abstract on(event: string, listener: any): void;
  public abstract once(event: string, listener: any): void;
  public abstract off(event: string, listener: any): void;

  // called by proposer
  public abstract create(params?: any): Promise<any>;
  // called by responder
  public abstract respond(params?: any): Promise<any>;
  // called by either to terminate
  public abstract delete(params?: any): Promise<any>;

  // ---------- Protected ----------------------------------------------- //

  // called by proposer (internally)
  protected abstract propose(params?: any): Promise<any>;
  // called by both (internally)
  protected abstract settle(params?: any): Promise<any>;

  // callback for proposed subscriptions
  protected abstract onResponse(messageEvent: MessageEvent): Promise<any>;
  // callback for responded subscriptions
  protected abstract onAcknowledge(messageEvent: MessageEvent): Promise<any>;
  // callback for settled subscriptions
  protected abstract onMessage(messageEvent: MessageEvent): Promise<any>;
}
