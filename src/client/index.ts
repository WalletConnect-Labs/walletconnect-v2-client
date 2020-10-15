import { EventEmitter } from "events";

import { Store, Connection, Session, Relay } from "./controllers";
import { IClient, ClientOptions, RelayUserOptions } from "../types";

export class Client extends IClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  protected events = new EventEmitter();

  public connection: Connection;
  public relay: Relay;
  public session: Session;
  public store: Store;

  constructor(opts?: ClientOptions) {
    super(opts);
    this.connection = new Connection(this);
    this.session = new Session(this);
    this.store = opts?.store || new Store();
    this.relay = new Relay();
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

  public async connect() {
    // TODO: implement connect
  }
}
