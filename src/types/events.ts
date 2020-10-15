import { EventEmitter } from "events";

export interface Message {
  topic: string;
  message: string;
}

export type MessageListener = (messageEvent: Message) => void;

export abstract class IEvents {
  protected abstract events: EventEmitter;

  public abstract on(event: string, listener: MessageListener): void;
  public abstract once(event: string, listener: MessageListener): void;
  public abstract off(event: string, listener: MessageListener): void;
}
