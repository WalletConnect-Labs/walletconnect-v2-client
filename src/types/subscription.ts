import { KeyValue } from "../client/controllers";
import { IClient } from "./client";
import { IEvents } from "./events";

export interface SubscriptionContext {
  name: string;
  status: string;
}

export interface SubscriptionTracker<Data> {
  topic: string;
  relay: string;
  data: Data;
}

export declare namespace SubscriptionEvent {
  export interface Message {
    topic: string;
    message: string;
  }

  export interface Created<T> {
    topic: string;
    data: T;
  }

  export interface Updated<T> {
    topic: string;
    data: T;
  }

  export interface Deleted<T> {
    topic: string;
    data: T;
    reason: string;
  }
}

export abstract class ISubscription<Data> extends IEvents {
  public abstract subscriptions = new Map<string, SubscriptionTracker<Data>>();

  public abstract readonly length: number;

  public abstract readonly entries: KeyValue<SubscriptionTracker<Data>>;

  constructor(public client: IClient, public context: SubscriptionContext) {
    super();
  }

  public abstract init(): Promise<void>;

  public abstract set(topic: string, relay: string, data: Data): Promise<void>;

  public abstract get(topic: string): Promise<Data>;

  public abstract del(topic: string, reason: string): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onMessage(messageEvent: SubscriptionEvent.Message): Promise<any>;
}
