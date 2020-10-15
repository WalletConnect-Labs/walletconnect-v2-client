import { EventEmitter } from "events";

import { IClient, ISubscription } from "../../types";

export class Subscription<T = any> extends ISubscription<T> {
  public subscriptions = new Map<string, T>();

  private events = new EventEmitter();

  constructor(public client: IClient, public name = "") {
    super(client, name);
  }

  public async set(topic: string, subscription: T): Promise<void> {
    this.subscriptions.set(topic, subscription);
    this.events.emit("created", subscription);
    this.client.relay.subscribe(
      topic,
      (message: string) => this.onMessage(topic, message),
      (subscription as any).relay,
    );
  }

  public async get(topic: string): Promise<T> {
    const subscription = this.subscriptions.get(topic);
    if (!subscription) {
      throw new Error(`No matching ${this.name} subscriptions with topic: ${topic}`);
    }
    return subscription;
  }

  public async del(topic: string): Promise<void> {
    const subscription = await this.get(topic);
    this.client.relay.unsubscribe(
      topic,
      (message: string) => this.onMessage(topic, message),
      (subscription as any).relay,
    );
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

  // ---------- Protected ----------------------------------------------- //

  protected async onMessage(topic: string, message: string) {
    this.events.emit("message", { topic, message });
  }
}
