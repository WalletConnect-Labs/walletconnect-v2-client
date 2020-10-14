import { IRelayController, RelayUserOptions } from "./relay";
import { IConnectionController } from "./connection";
import { ISessionController } from "./session";
import { IStoreController } from "./store";

export abstract class ISubscriptionController<T> {
  public abstract subscriptions = new Map<string, T>();

  constructor(public client: IClient, public name = "") {}

  public abstract set(topic: string, subscription: T): Promise<void>;

  public abstract get(topic: string): Promise<T>;
  public abstract del(topic: string): Promise<void>;

  public abstract on(event: string, listener: any): void;
  public abstract once(event: string, listener: any): void;
  public abstract off(event: string, listener: any): void;
}

export abstract class IProtocolController {
  // proposed subscriptions
  public abstract proposed: ISubscriptionController<any>;
  // created subscriptions
  public abstract created: ISubscriptionController<any>;

  constructor(public client: IClient) {}

  // called by the initiator
  public abstract propose(opts: any): Promise<any>;
  // called by the responder
  public abstract respond(opts: any): Promise<any>;
  // called by both after successful connection
  public abstract create(opts: any): Promise<any>;
  // called by either when disconnecting
  public abstract delete(opts: any): Promise<any>;

  // callback for proposed subscriptions
  public abstract onResponse(payload: any): Promise<any>;
  // callback for created subscriptions
  public abstract onMessage(payload: any): Promise<any>;
}

export interface ClientOptions {
  store?: IStoreController;
  relay?: RelayUserOptions;
}

export abstract class IClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  public abstract connection: IConnectionController;
  public abstract session: ISessionController;

  public abstract store: IStoreController;
  public abstract relay: IRelayController;

  constructor(opts: ClientOptions) {}

  public abstract connect();
}
