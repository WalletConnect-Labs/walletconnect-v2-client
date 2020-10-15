import { IEvents } from "./events";
import { IJsonRpcProvider } from "./jsonrpc";

export abstract class IRelayClient extends IEvents {
  public abstract provider: IJsonRpcProvider;

  constructor(relayOptions?: RelayClientOptions) {
    super();
  }

  public abstract connect(): Promise<any>;

  public abstract disconnect(): Promise<void>;

  public abstract publish(topic: string, message: string): void;

  public abstract subscribe(topic: string, listener: (message: string) => void): any;

  public abstract unsubscribe(topic: string, listener: (message: string) => void): any;
}

export abstract class IRelay extends IEvents {
  public abstract default: string;
  public abstract clients: RelayClients;

  constructor(opts: RelayUserOptions = {}) {
    super();
  }

  public abstract init(opts?: RelayUserOptions): Promise<void>;

  public abstract publish(topic: string, message: string, relay?: string): any;

  public abstract subscribe(
    topic: string,
    listener: (message: string) => void,
    relay?: string,
  ): any;

  public abstract unsubscribe(
    topic: string,
    listener: (message: string) => void,
    relay?: string,
  ): any;
}

export interface RelayClientOptions {
  provider?: IJsonRpcProvider;
  providerOpts?: any;
}

export interface RelayUserOptions {
  default?: string;
  [relay: string]: any;
}

export interface RelayClients {
  [relay: string]: IRelayClient;
}
