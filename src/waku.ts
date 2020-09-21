import { EventEmitter } from "events";

import { JsonRpcProvider } from "./types";
import { WakuProvider } from "./socket";
import { payloadId } from "./utils";

class WakuClient {
  private events = new EventEmitter();

  public provider: JsonRpcProvider;

  constructor(provider?: JsonRpcProvider) {
    this.provider = provider || new WakuProvider();
    this.provider.on("message", this.onMessage);
  }

  public publish(topic: string, message: string) {
    this.provider.request({
      id: payloadId(),
      jsonrpc: "2.0",
      method: "waku_publish",
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
        method: "waku_subscribe",
        params: { topic },
      })
      .then(id => {
        this.events.on(id, listener);
      });
  };

  // ---------- Private ----------------------------------------------- //

  private onMessage(e: any) {
    const payload = JSON.parse(e.data);
    if (payload.method === "waku_subscription") {
      const { subscription, data } = payload.params;
      this.events.emit(subscription, data);
    } else {
      this.events.emit(`${payload.id}`, payload);
    }
  }
}

export default WakuClient;
