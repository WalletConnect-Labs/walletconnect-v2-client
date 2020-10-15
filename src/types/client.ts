import { IRelay, RelayUserOptions } from "./relay";
import { IConnection } from "./connection";
import { ISession } from "./session";
import { IStore } from "./store";
import { IEvents } from "./events";

export abstract class ISubscription<T> extends IEvents {
  public abstract subscriptions = new Map<string, T>();

  constructor(public client: IClient, public name = "") {
    super();
  }

  public abstract set(topic: string, subscription: T): Promise<void>;

  public abstract get(topic: string): Promise<T>;
  public abstract del(topic: string): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onMessage(topic: string, message: string): Promise<any>;
}

export abstract class IProtocol extends IEvents {
  // proposed subscriptions
  public abstract proposed: ISubscription<any>;
  // responded subscriptions
  public abstract responded: ISubscription<any>;
  // created subscriptions
  public abstract created: ISubscription<any>;

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
  protected abstract onResponse(topic: string, message: string): Promise<any>;
  // callback for responded subscriptions
  protected abstract onAcknowledge(topic: string, message: string): Promise<any>;
  // callback for created subscriptions
  protected abstract onMessage(topic: string, message: string): Promise<any>;
}

export interface ClientOptions {
  store?: IStore;
  relay?: RelayUserOptions;
}

export abstract class IClient extends IEvents {
  public readonly protocol = "wc";
  public readonly version = 2;

  public abstract connection: IConnection;
  public abstract session: ISession;

  public abstract store: IStore;
  public abstract relay: IRelay;

  constructor(opts?: ClientOptions) {
    super();
  }

  public abstract connect();
}
