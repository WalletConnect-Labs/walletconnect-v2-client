import { EventEmitter } from "events";

import { Store, Connection, Session, Relay } from "./controllers";
import { IClient, ClientOptions, RelayUserOptions } from "../types";

export class Client implements IClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  private events = new EventEmitter();
  public connection: Connection;
  public relay: Relay;
  public session: Session;
  public store: Store;

  constructor(opts?: ClientOptions) {
    this.connection = new Connection(this);
    this.session = new Session(this);
    this.store = opts?.store || new Store();
    this.relay = new Relay();
  }

  public async connect() {
    // TODO: implement connect
  }
}
