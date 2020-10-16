import { KeyValue } from "../client/controllers";
import { IClient } from "./client";
import { IEvents, MessageEvent } from "./events";

export interface SubscriptionContext {
  name: string;
  status: string;
}

export abstract class ISubscription<T> extends IEvents {
  public abstract subscriptions = new Map<string, T>();

  public abstract readonly length: number;

  public abstract readonly map: KeyValue<T>;

  constructor(public client: IClient, public context: SubscriptionContext) {
    super();
  }

  public abstract init(): Promise<void>;

  public abstract set(topic: string, subscription: T): Promise<void>;

  public abstract get(topic: string): Promise<T>;

  public abstract del(topic: string, reason: string): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onMessage(messageEvent: MessageEvent): Promise<any>;
}
