import { Store } from "../store";
import { RelayClientMapping } from "../relay";
import {
  WalletConnectClient,
  WalletConnectClientOptions,
  RelayUserOptions,
  RelaySetup,
} from "../types";
import { ConnectionController, SessionController } from "./controllers";

export class Client implements WalletConnectClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  public connection: ConnectionController;
  public session: SessionController;

  public store: Store;
  public relay: RelaySetup = {
    default: "bridge",
    clients: {},
  };

  constructor(opts?: WalletConnectClientOptions) {
    this.connection = new ConnectionController(this);
    this.session = new SessionController(this);
    this.store = opts?.store || new Store();
    this.relay = this.setupRelays(opts);
  }

  public async connect() {}

  // ---------- Private ----------------------------------------------- //

  private assertRelayOpts(relayOpts: RelayUserOptions) {
    Object.keys(relayOpts).forEach(key => {
      if (!Object.keys(RelayClientMapping).includes(key)) {
        throw new Error(`${key} relay is not supported or invalid`);
      }
    });
  }

  private setupRelays(opts?: WalletConnectClientOptions): RelaySetup {
    let relayOpts: RelayUserOptions = {};
    if (opts?.relay?.opts) {
      this.assertRelayOpts(opts.relay.opts);
      relayOpts = { ...relayOpts, ...opts.relay.opts };
    }
    const relay: RelaySetup = {
      default: relayOpts.default || "bridge",
      clients: {},
    };
    Object.keys(RelayClientMapping).forEach(key => {
      relay.clients[key] = RelayClientMapping[key](relayOpts[key]);
    });
    return relay;
  }
}
