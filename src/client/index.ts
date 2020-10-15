import { EventEmitter } from "events";

import { Store, Connection, Session, Relay } from "./controllers";
import {
  IClient,
  ClientOptions,
  RelayUserOptions,
  ClientConnectParams,
  ClientDisconnectParams,
} from "../types";

export class Client extends IClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  protected events = new EventEmitter();

  public connection: Connection;
  public session: Session;

  public relay: Relay;
  public store: Store;

  static async init(opts?: ClientOptions): Promise<Client> {
    const client = new Client(opts);
    await client.initialize();
    return client;
  }

  constructor(opts?: ClientOptions) {
    super(opts);

    this.connection = new Connection(this);
    this.session = new Session(this);

    this.store = opts?.store || new Store();
    this.relay = new Relay(opts?.relay);
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

  public async connect(params: ClientConnectParams) {
    // TODO: implement connect
    // the client should be able to render the UI internally by defining a standard user flow events
    //
    // required context params:
    //    - environment identifier (aka connection metadata)
    //    - persisted connections
    //    - persisted sessions
    //
    // required user params:
    //    - application identifier (aka session metadata)
    //
    // first: verify if there are any connections created
    // if no connection is present,
    //    - prompt user to create one
    // if a connection is present
    //    - prompt user to select existing or create a new one
    // once a connection is established
    //    - trigger connection_approved
    //
    // second: verify if session matches application
    // if no sessions exists matching application
    //    - prompt the user to approve session on mobile
    // if a session exists matching application
    //    - proceed
    // once a session is established
    //    - trigger session_approved
    //
    // finally: resolve promise
  }

  public async disconnect(params: ClientDisconnectParams) {
    // TODO: implement disconnect
    // the client should be able to create the UI internally by defining a standard user flow
    //
    // required context params:
    //    - environment identifier (aka connection metadata)
    //    - persisted connections
    //    - persisted sessions
    //
    // required user params:
    //    - application identifier (aka session metadata)
    //
    // first: verify if connection and/or matching session exists
    // if no connection/session present
    //    - throw error
    // if a connection/session present
    //    - this.session.delete()
    //
    // finally: resolve promise
  }

  // ---------- Private ----------------------------------------------- //

  private async initialize(): Promise<any> {
    await this.store.init();
    await this.relay.init();
  }
}
