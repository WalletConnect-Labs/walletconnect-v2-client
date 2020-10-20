import { EventEmitter } from "events";
import { JsonRpcPayload } from "rpc-json-utils";
import { safeJsonParse, safeJsonStringify } from "safe-json-utils";

import { Relays } from "../relays";
import {
  RelayUserOptions,
  RelayPublishOptions,
  RelaySubscribeOptions,
  RelayClients,
  IRelay,
} from "../../types";
import { DEFAULT_RELAY } from "../constants";
import { encrypt, decrypt } from "../../utils";

export class Relay extends IRelay {
  public default = DEFAULT_RELAY;
  public clients: RelayClients = {};

  public events = new EventEmitter();

  constructor(opts: RelayUserOptions = {}) {
    super();
    if (Object.keys(opts)) {
      this.assertRelayOpts(opts);
    }
    this.default = opts.default || DEFAULT_RELAY;
    Object.keys(Relays).forEach(name => {
      const RelayClient = Relays[name];
      this.clients[name] = new RelayClient(opts[name]);
    });
  }

  public async init(opts: RelayUserOptions = {}): Promise<void> {
    await Promise.all(Object.keys(this.clients).map(name => this.clients[name].connect()));
  }

  public async publish(
    topic: string,
    payload: JsonRpcPayload,
    opts?: RelayPublishOptions,
  ): Promise<void> {
    const relay = opts?.relay || this.default;
    const msg = safeJsonStringify(payload);
    const message = opts?.encrypt
      ? await encrypt({
          ...opts.encrypt,
          message: msg,
        })
      : msg;
    this.clients[relay].publish(topic, message);
  }

  public subscribe(
    topic: string,
    listener: (payload: JsonRpcPayload) => void,
    opts?: RelaySubscribeOptions,
  ): void {
    const relay = opts?.relay || this.default;
    this.clients[relay].subscribe(topic, async (message: string) => {
      const payload = safeJsonParse(
        opts?.decrypt
          ? await decrypt({
              ...opts.decrypt,
              encrypted: message,
            })
          : message,
      );
      listener(payload);
    });
  }

  public unsubscribe(
    topic: string,
    listener: (payload: JsonRpcPayload) => void,
    opts?: RelaySubscribeOptions,
  ): void {
    const relay = opts?.relay || this.default;
    this.clients[relay].unsubscribe(topic, async (message: string) => {
      const payload = safeJsonParse(
        opts?.decrypt
          ? await decrypt({
              ...opts.decrypt,
              encrypted: message,
            })
          : message,
      );
      listener(payload);
    });
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

  // ---------- Private ----------------------------------------------- //

  private assertRelayOpts(opts: RelayUserOptions) {
    Object.keys(opts).forEach(key => {
      if (!Object.keys(Relays).includes(key)) {
        throw new Error(`${key} relay is not supported or invalid`);
      }
    });
  }
}
