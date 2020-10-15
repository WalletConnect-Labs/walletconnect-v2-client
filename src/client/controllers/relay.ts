import { Relays } from "../relays";
import { RelayUserOptions, RelayClients, IRelay } from "../../types";

export class Relay implements IRelay {
  public default = "bridge";
  public clients: RelayClients = {};

  constructor(opts: RelayUserOptions = {}) {
    if (Object.keys(opts)) {
      this.assertRelayOpts(opts);
    }
    this.default = opts.default || "bridge";
    Object.keys(Relays).forEach(key => {
      this.clients[key] = Relays[key](opts[key]);
    });
  }

  public publish(topic: string, message: string, relay = this.default): any {
    this.clients[relay].publish(topic, message);
  }

  public subscribe(topic: string, listener: (...args: any[]) => void, relay = this.default): any {
    this.clients[relay].subscribe(topic, listener);
  }

  public unsubscribe(topic: string, listener: (...args: any[]) => void, relay = this.default): any {
    this.clients[relay].unsubscribe(topic, listener);
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
