import { EventEmitter } from "events";

export interface MessageEvent {
  topic: string;
  message: string;
}

export interface CreatedEvent<T> {
  topic: string;
  subscription: T;
}

export interface UpdatedEvent<T> {
  topic: string;
  subscription: T;
}

export interface DeletedEvent<T> {
  topic: string;
  subscription: T;
  reason: string;
}

export abstract class IEvents {
  protected abstract events: EventEmitter;

  public abstract on(event: string, listener: any): void;
  public abstract once(event: string, listener: any): void;
  public abstract off(event: string, listener: any): void;
}
