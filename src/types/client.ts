import { IRelay, RelayUserOptions } from "./relay";
import { IConnection } from "./connection";
import { ISession } from "./session";
import { IStore } from "./store";
import { IEvents } from "./events";

export interface ClientOptions {
  store?: IStore;
  relay?: RelayUserOptions;
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

  public abstract connect();
}
