import { EventEmitter } from "events";

import { StoreController } from "./controllers";
import { IClient, ClientOptions, RelayUserOptions } from "../types";
import { ConnectionController, SessionController, RelayController } from "./controllers";

export class Client implements IClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  private events = new EventEmitter();
  public connection: ConnectionController;
  public relay: RelayController;
  public session: SessionController;
  public store: StoreController;

  constructor(opts?: ClientOptions) {
    this.connection = new ConnectionController(this);
    this.session = new SessionController(this);
    this.store = opts?.store || new StoreController();
    this.relay = new RelayController();
  }

  public async connect() {}
}
