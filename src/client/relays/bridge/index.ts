import { EventEmitter } from "events";
import { JsonRpcRequest, formatJsonRpcRequest } from "rpc-json-utils";

import {
  IJsonRpcProvider,
  IRelayClient,
  BridgePublishParams,
  BridgeSubscribeParams,
  BridgeSubscriptionParams,
  BridgeUnsubscribeParams,
} from "../../../types";
import { BRIDGE_DEFAULT_TTL, BRIDGE_JSONRPC } from "../../constants";
import { BridgeProvider } from "./provider";

export class BridgeClient extends IRelayClient {
  public events = new EventEmitter();

  public provider: IJsonRpcProvider;

  constructor(provider?: IJsonRpcProvider) {
    super();
    this.provider = provider || new BridgeProvider();
    this.provider.on("request", this.onRequest);
  }

  public async connect(): Promise<void> {
    await this.provider.connect();
  }

  public async disconnect(): Promise<void> {
    await this.provider.disconnect();
  }

  public publish(topic: string, message: string): void {
    this.provider.request(
      formatJsonRpcRequest(BRIDGE_JSONRPC.publish, {
        topic,
        message,
        ttl: BRIDGE_DEFAULT_TTL,
      } as BridgePublishParams),
    );
  }

  public subscribe = (topic: string, listener: (message: string) => void): void => {
    this.provider
      .request(
        formatJsonRpcRequest(BRIDGE_JSONRPC.subscribe, {
          topic,
          ttl: BRIDGE_DEFAULT_TTL,
        } as BridgeSubscribeParams),
      )
      .then(id => {
        this.events.on(id, listener);
      });
  };

  public unsubscribe = (topic: string, listener: (message: string) => void): void => {
    this.provider
      .request(
        formatJsonRpcRequest(BRIDGE_JSONRPC.unsubscribe, {
          topic,
          ttl: BRIDGE_DEFAULT_TTL,
        } as BridgeUnsubscribeParams),
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

  private onRequest(request: JsonRpcRequest) {
    if (request.method === BRIDGE_JSONRPC.subscription) {
      const params = request.params as BridgeSubscriptionParams;
      this.events.emit(params.topic, params.message);
    } else {
      this.events.emit("request", request);
    }
  }
}
