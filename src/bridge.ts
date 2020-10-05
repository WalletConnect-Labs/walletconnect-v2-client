import { EventEmitter } from "events";

import { JsonRpcProvider } from "./types";
import { BridgeProvider } from "./socket";
import { payloadId } from "./utils";

class BridgeClient {
  private events = new EventEmitter();

  public provider: JsonRpcProvider;

  constructor(provider?: JsonRpcProvider) {
    this.provider = provider || new BridgeProvider();
    this.provider.on("message", this.onMessage);
  }

  public publish(topic: string, message: string) {
    this.provider.request({
      id: payloadId(),
      jsonrpc: "2.0",
      method: "bridge_publish",
      params: [
        {
          topic,
          message,
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
        params: { topic },
      })
      .then(id => {
        this.events.on(id, listener);
      });
  };

  // ---------- Private ----------------------------------------------- //

  private onMessage(e: any) {
    const payload = JSON.parse(e.data);
    if (payload.method === "bridge_subscription") {
      const { subscription, data } = payload.params;
      this.events.emit(subscription, data);
    } else {
      this.events.emit(`${payload.id}`, payload);
    }
  }
}

export default BridgeClient;
