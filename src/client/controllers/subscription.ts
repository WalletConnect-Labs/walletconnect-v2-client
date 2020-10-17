import { EventEmitter } from "events";

import {
  IClient,
  ISubscription,
  SubscriptionEvent,
  SubscriptionContext,
  SubscriptionTracker,
} from "../../types";
import { mapToObj, objToMap } from "../../utils";
import { SUBSCRIPTION_EVENTS } from "../constants";
import { KeyValue } from "./store";

export class Subscription<Data = any> extends ISubscription<Data> {
  public subscriptions = new Map<string, SubscriptionTracker<Data>>();

  public events = new EventEmitter();

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

  get entries(): KeyValue<SubscriptionTracker<Data>> {
    return mapToObj<SubscriptionTracker<Data>>(this.subscriptions);
  }

  public async set(topic: string, relay: string, data: Data): Promise<void> {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, { topic, relay, data });
      this.events.emit(SUBSCRIPTION_EVENTS.updated, { topic, data } as SubscriptionEvent.Updated<
        Data
      >);
    } else {
      this.subscriptions.set(topic, { topic, relay, data });
      this.events.emit(SUBSCRIPTION_EVENTS.created, {
        topic,
        data,
      } as SubscriptionEvent.Created<Data>);
      this.client.relay.subscribe(
        topic,
        (message: string) => this.onMessage({ topic, message }),
        relay,
      );
    }
  }

  public async get(topic: string): Promise<Data> {
    const subscription = this.subscriptions.get(topic);
    if (!subscription) {
      throw new Error(
        `No matching ${this.context.status} ${this.context.name} with topic: ${topic}`,
      );
    }
    return subscription.data;
  }

  public async del(topic: string, reason: string): Promise<void> {
    const subscription = this.subscriptions.get(topic);
    if (!subscription) {
      throw new Error(
        `No matching ${this.context.status} ${this.context.name} with topic: ${topic}`,
      );
    }
    this.client.relay.unsubscribe(
      topic,
      (message: string) => this.onMessage({ topic, message }),
      subscription.relay,
    );
    this.events.emit(SUBSCRIPTION_EVENTS.deleted, {
      topic,
      data: subscription.data,
      reason,
    } as SubscriptionEvent.Deleted<Data>);
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
    await this.client.store.set<KeyValue<SubscriptionTracker<Data>>>(
      `${this.context.name}:${this.context.status}`,
      this.entries,
    );
  }

  private async restore() {
    const subscriptions = await this.client.store.get<KeyValue<SubscriptionTracker<Data>>>(
      `${this.context.name}:${this.context.status}`,
    );
    if (typeof subscriptions === "undefined") return;
    if (this.subscriptions.size) {
      throw new Error(
        `Restore will override already set ${this.context.status} ${this.context.name}`,
      );
    }
    this.subscriptions = objToMap<SubscriptionTracker<Data>>(subscriptions);
    for (const [_, subscription] of this.subscriptions) {
      const { topic, relay } = subscription;
      this.client.relay.subscribe(
        topic,
        (message: string) => this.onMessage({ topic, message }),
        relay,
      );
    }
  }

  private registerEventListeners(): void {
    this.events.on(SUBSCRIPTION_EVENTS.created, () => this.persist());
    this.events.on(SUBSCRIPTION_EVENTS.updated, () => this.persist());
    this.events.on(SUBSCRIPTION_EVENTS.deleted, () => this.persist());
  }
}
