import { EventEmitter } from "events";

import { Store, Connection, Session, Relay } from "./controllers";
import {
  IClient,
  ClientOptions,
  ClientConnectParams,
  ClientDisconnectParams,
  ConnectionTypes,
} from "../types";
import { formatUri } from "../utils";
import { timeStamp } from "console";
import { CONNECTION_EVENTS } from "./constants";

export class Client extends IClient {
  public readonly protocol = "wc";
  public readonly version = 2;

  protected events = new EventEmitter();

  public store: Store;
  public relay: Relay;

  public connection: Connection;
  public session: Session;

  static async init(opts?: ClientOptions): Promise<Client> {
    const client = new Client(opts);
    await client.initialize();
    return client;
  }

  constructor(opts?: ClientOptions) {
    super(opts);

    this.relay = new Relay(opts?.relay);
    this.store = opts?.store || new Store();

    this.connection = new Connection(this);
    this.session = new Session(this);
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
    let connection: ConnectionTypes.Settled;
    if (!this.connection.length) {
      this.connection.on(CONNECTION_EVENTS.proposed, (proposed: ConnectionTypes.Proposed) => {
        const uri = formatUri(this.protocol, this.version, proposed.topic, {
          relay: proposed.topic,
          publicKey: proposed.keyPair.publicKey,
        });
        this.events.emit("show_uri", { uri });
      });
      connection = await this.connection.create();
    } else {
      // TODO: display connections to be selected
      // this.events.emit("show_connections", { connections: this.connections.map })
      //
      // (temporarily let's just select the first one)
      //
      connection = this.connection.settled.subscriptions.values().next().value;
    }
  }

  public async disconnect(params: ClientDisconnectParams) {
    // TODO: implement disconnect
    // the client should be able to settle the UI internally by defining a standard user flow
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
    await this.relay.init();
    await this.store.init();
    await this.connection.init();
    await this.session.init();
  }
}
