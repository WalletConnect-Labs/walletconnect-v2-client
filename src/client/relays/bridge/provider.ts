import { EventEmitter } from "events";

import { JsonRpcRequest, JsonRpcProvider } from "../../../types";

const WS =
  // @ts-ignore
  typeof global.WebSocket !== "undefined" ? global.WebSocket : require("ws");

export class BridgeProvider implements JsonRpcProvider {
  private events = new EventEmitter();

  public rpcUrl: string;
  public socket: WebSocket | undefined;

  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl || "wss://bridge.walletconnect.org";
  }

  public async connect() {
    const socket = new WS(this.rpcUrl);
    socket.onmessage = (event: MessageEvent) => this.onMessage(event.data);
    this.socket = socket;
  }

  public async disconnect() {
    if (typeof this.socket === "undefined") {
      throw new Error("Socket is not connected");
    }
    this.socket.close();
    this.socket = undefined;
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

  public async request(payload: JsonRpcRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.events.on(`${payload.id}`, response => {
        if (response.error) {
          reject(response.error.message);
        } else {
          resolve(response.result);
        }
      });
      if (typeof this.socket === "undefined") {
        throw new Error("Socket is not connected");
      }
      this.socket.send(JSON.stringify(payload));
    });
  }

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
