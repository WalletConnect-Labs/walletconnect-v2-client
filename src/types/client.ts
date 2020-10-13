import { ConnectionController, SessionController } from "../client/controllers";
import { RelaySetup, RelayUserOptions } from "./relay";
import { KeyValueStore } from "./store";

export interface WalletConnectClientOptions {
  store?: KeyValueStore;
  relay?: RelayUserOptions;
}

export abstract class WalletConnectClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  public abstract connection: ConnectionController;
  public abstract session: SessionController;

  public abstract store: KeyValueStore;
  public abstract relay: RelaySetup;

  constructor(opts: WalletConnectClientOptions) {}

  public abstract connect();
}
