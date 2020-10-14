import { EventEmitter } from "events";

import { JsonRpcProvider, IRelayClient } from "../../../types";
import { BridgeProvider } from "./provider";
import { payloadId } from "../../../utils";

export class BridgeClient implements IRelayClient {
  private events = new EventEmitter();

  public provider: JsonRpcProvider;

  constructor(provider?: JsonRpcProvider) {
    this.provider = provider || new BridgeProvider();
    this.provider.on("message", this.onMessage);
  }

  public init() {}

  public publish(topic: string, message: string) {
    this.provider.request({
      id: payloadId(),
      jsonrpc: "2.0",
      method: "bridge_publish",
      params: [
        {
          topic,
          message,
          ttl: 86400,
        },
      ],
    });
  }

  public subscribe = (topic: string, listener: (...args: any[]) => void): any => {
    return this.provider
      .request({
        id: payloadId(),
        jsonrpc: "2.0",
        method: "bridge_subscribe",
        params: {
          topic,
          ttl: 86400,
        },
      })
      .then(id => {
        this.events.on(id, listener);
      });
  };

  public unsubscribe = (topic: string, listener: (...args: any[]) => void): any => {
    return this.provider
      .request({
        id: payloadId(),
        jsonrpc: "2.0",
        method: "bridge_unsubscribe",
        params: {
          topic,
          ttl: 86400,
        },
      })
      .then(id => {
        this.events.off(id, listener);
      });
  };

  // ---------- Private ----------------------------------------------- //

  private onMessage(e: any) {
    const payload = JSON.parse(e.data);
    if (payload.method === "bridge_subscription") {
      this.events.emit(payload.params.topic, payload.params.payload);
    } else {
      this.events.emit(`${payload.id}`, payload);
    }
  }
}