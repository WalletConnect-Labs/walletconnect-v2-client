import { IJsonRpcProvider } from "rpc-json-utils";

import { IRelay, RelayProtocolOptions } from "./relay";
import { IConnection } from "./connection";
import { ISession, SessionTypes } from "./session";
import { IStore } from "./store";
import { IEvents } from "./events";

export interface ClientOptions {
  store?: IStore;
  relayProvider?: IJsonRpcProvider;
}

export interface ClientConnectParams {
  chains: string[];
  jsonrpc: string[];
  app?: string | SessionTypes.Metadata;
  relay?: RelayProtocolOptions;
}

export interface ClientDisconnectParams {
  topic: string;
  reason: string;
}

export abstract class IClient extends IEvents {
  public readonly protocol = "wc";
  public readonly version = 2;

  public abstract store: IStore;
  public abstract relay: IRelay;

  public abstract connection: IConnection;
  public abstract session: ISession;

  constructor(opts?: ClientOptions) {
    super();
  }

  public abstract connect(params: ClientConnectParams);
  public abstract disconnect(params: ClientDisconnectParams);
}
