import { EventEmitter } from "events";

import { IJsonRpcProvider, IRelayClient } from "../../../types";
import { BridgeProvider } from "./provider";
import { formatJsonRpcRequest, payloadId } from "../../../utils";

export class BridgeClient extends IRelayClient {
  protected events = new EventEmitter();

  public provider: IJsonRpcProvider;

  constructor(provider?: IJsonRpcProvider) {
    super();
    this.provider = provider || new BridgeProvider();
    this.provider.on("message", this.onMessage);
  }

  public async init(): Promise<any> {
    // TODO: implement init
  }

  public publish(topic: string, message: string): void {
    this.provider.request(
      formatJsonRpcRequest("bridge_publish", {
        topic,
        message,
        ttl: 86400,
      }),
    );
  }

  public subscribe = (topic: string, listener: (message: string) => void): any => {
    return this.provider
      .request(
        formatJsonRpcRequest("bridge_subscribe", {
          topic,
          ttl: 86400,
        }),
      )
      .then(id => {
        this.events.on(id, listener);
      });
  };

  public unsubscribe = (topic: string, listener: (message: string) => void): any => {
    return this.provider
      .request(
        formatJsonRpcRequest("bridge_unsubscribe", {
          topic,
          ttl: 86400,
        }),
      )
      .then(id => {
        this.events.off(id, listener);
      });
  };

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

  private onMessage(e: any) {
    const payload = JSON.parse(e.data);
    if (payload.method === "bridge_subscription") {
      this.events.emit(payload.params.topic, payload.params.payload);
    } else {
      this.events.emit(`${payload.id}`, payload);
    }
  }
}
