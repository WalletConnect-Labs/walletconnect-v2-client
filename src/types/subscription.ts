import { IClient } from "./client";
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
