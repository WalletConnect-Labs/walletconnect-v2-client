import { EventEmitter } from "events";

import { JsonRpcRequest, JsonRpcProvider } from "./types";

const WS =
  // @ts-ignore
  typeof global.WebSocket !== "undefined" ? global.WebSocket : require("ws");

export class WakuProvider implements JsonRpcProvider {
  private events = new EventEmitter();

  public rpcUrl: string;
  public socket: WebSocket;

  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl || "wss://waku.walletconnect.org";
    this.socket = new WS(this.rpcUrl);
    this.socket.onmessage = (event: MessageEvent) => this.onMessage(event.data);
  }

  public on(event: string, listener: any): void {
    this.events.on(event, listener);
  }

  public async request(payload: JsonRpcRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.events.on(`${payload.id}`, response => {
        if (response.error) {
          reject(response.error.message);
        } else {
          resolve(response.result);
        }
      });
      this.socket.send(JSON.stringify(payload));
    });
  }

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
