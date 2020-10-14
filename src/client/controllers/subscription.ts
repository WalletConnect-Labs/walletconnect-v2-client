import { EventEmitter } from "events";

import { IClient, ISubscriptionController } from "../../types";

export class SubscriptionController<T = any> implements ISubscriptionController<T> {
  public subscriptions = new Map<string, T>();

  private events = new EventEmitter();

  constructor(public client: IClient, public name = "") {}

  public async set(topic: string, subscription: T): Promise<void> {
    this.subscriptions.set(topic, subscription);
    this.events.emit("created", subscription);
    this.client.relay.subscribe(topic, this.onPayload.bind(this), (subscription as any).relay);
  }

  public async get(topic: string): Promise<T> {
    const subscription = this.subscriptions.get(topic);
    if (!subscription) {
      throw new Error("No matching proposed connection setups");
    }
    return subscription;
  }

  public async del(topic: string): Promise<void> {
    const subscription = await this.get(topic);
    this.client.relay.unsubscribe(topic, this.onPayload.bind(this), (subscription as any).relay);
    this.events.emit("deleted", subscription);
  }

  public on(event: string, listener: any): void {
    this.events.on(event, listener);
  }
  public once(event: string, listener: any): void {
    this.events.once(event, listener);
  }
  public off(event: string, listener: any): void {
    this.events.off(event, listener);
  }

  // ---------- Private ----------------------------------------------- //

  private async onPayload(payload: any) {
    this.events.emit("payload", payload);
  }
}
