import { EventEmitter } from "events";

import { IClient, ISubscription, SubscriptionEvent, SubscriptionContext } from "../../types";
import { mapToObj, objToMap } from "../../utils";
import { SUBSCRIPTION_EVENTS } from "../constants";
import { KeyValue } from "./store";

export class Subscription<T = any> extends ISubscription<T> {
  public subscriptions = new Map<string, T>();

  protected events = new EventEmitter();

  constructor(public client: IClient, public context: SubscriptionContext) {
    super(client, context);
    this.registerEventListeners();
  }

  public async init(): Promise<void> {
    await this.restore();
  }

  get length(): number {
    return this.subscriptions.size;
  }

  get map(): KeyValue<T> {
    return mapToObj<T>(this.subscriptions);
  }

  public async set(topic: string, subscription: T): Promise<void> {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, subscription);
      this.events.emit(SUBSCRIPTION_EVENTS.updated, {
        topic,
        subscription,
      } as SubscriptionEvent.Updated<T>);
    } else {
      this.subscriptions.set(topic, subscription);
      this.events.emit(SUBSCRIPTION_EVENTS.created, {
        topic,
        subscription,
      } as SubscriptionEvent.Created<T>);
      this.client.relay.subscribe(
        topic,
        (message: string) => this.onMessage({ topic, message }),
        (subscription as any).relay,
      );
    }
  }

  public async get(topic: string): Promise<T> {
    const subscription = this.subscriptions.get(topic);
    if (!subscription) {
      throw new Error(
        `No matching ${this.context.status} ${this.context.name} with topic: ${topic}`,
      );
    }
    return subscription;
  }

  public async del(topic: string, reason: string): Promise<void> {
    const subscription = await this.get(topic);
    this.client.relay.unsubscribe(
      topic,
      (message: string) => this.onMessage({ topic, message }),
      (subscription as any).relay,
    );
    this.events.emit(SUBSCRIPTION_EVENTS.deleted, {
      topic,
      subscription,
      reason,
    } as SubscriptionEvent.Deleted<T>);
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

  protected async onMessage(messageEvent: SubscriptionEvent.Message) {
    this.events.emit(SUBSCRIPTION_EVENTS.message, messageEvent);
  }

  // ---------- Private ----------------------------------------------- //

  private async persist() {
    await this.client.store.set<KeyValue<T>>(
      `${this.context.name}:${this.context.status}`,
      this.map,
    );
  }

  private async restore() {
    const subscriptions = await this.client.store.get<KeyValue<T>>(
      `${this.context.name}:${this.context.status}`,
    );
    if (typeof subscriptions === "undefined") return;
    if (this.subscriptions.size) {
      throw new Error(
        `Restore will override already set ${this.context.status} ${this.context.name}`,
      );
    }
    this.subscriptions = objToMap<T>(subscriptions);
  }

  private registerEventListeners(): void {
    this.events.on(SUBSCRIPTION_EVENTS.created, () => this.persist());
    this.events.on(SUBSCRIPTION_EVENTS.updated, () => this.persist());
    this.events.on(SUBSCRIPTION_EVENTS.deleted, () => this.persist());
  }
}
