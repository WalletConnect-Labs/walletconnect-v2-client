import { IRelay, RelayUserOptions } from "./relay";
import { IConnection } from "./connection";
import { ISession } from "./session";
import { IStore } from "./store";
import { IEvents } from "./events";

export interface ClientOptions {
  store?: IStore;
  relay?: RelayUserOptions;
}

export interface ClientConnectParams {
  app: {
    id: string;
    meta: any;
  };
}

export interface ClientDisconnectParams {
  app: {
    id: string;
    meta: any;
  };
}

export abstract class IClient extends IEvents {
  public readonly protocol = "wc";
  public readonly version = 2;

  public abstract connection: IConnection;
  public abstract session: ISession;

  public abstract relay: IRelay;
  public abstract store: IStore;

  constructor(opts?: ClientOptions) {
    super();
  }

  public abstract connect(params: ClientConnectParams);
  public abstract disconnect(params: ClientDisconnectParams);
}
