import { IClient } from "./client";
import { IEvents, Message } from "./events";

export interface SubscriptionContext {
  name: string;
  status: string;
}

export abstract class ISubscription<T> extends IEvents {
  public abstract subscriptions = new Map<string, T>();

  constructor(public client: IClient, public context: SubscriptionContext) {
    super();
  }

  public abstract set(topic: string, subscription: T): Promise<void>;

  public abstract get(topic: string): Promise<T>;

  public abstract del(topic: string): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onMessage(messageEvent: Message): Promise<any>;
}
