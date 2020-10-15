import { JsonRpcProvider } from "./jsonrpc";

export abstract class IRelayClient {
  public abstract provider: JsonRpcProvider;

  constructor(relayOptions?: RelayClientOptions) {
    // empty
  }

  public abstract init(): Promise<any>;

  public abstract publish(topic: string, message: string): void;

  public abstract subscribe(topic: string, listener: (...args: any[]) => void): any;

  public abstract unsubscribe(topic: string, listener: (...args: any[]) => void): any;
}

export abstract class IRelay {
  public abstract default: string;
  public abstract clients: RelayClients;

  constructor(opts: RelayUserOptions = {}) {
    // empty
  }

  public abstract publish(topic: string, message: string, relay?: string): any;

  public abstract subscribe(topic: string, listener: (...args: any[]) => void, relay?: string): any;

  public abstract unsubscribe(
    topic: string,
    listener: (...args: any[]) => void,
    relay?: string,
  ): any;
}

export interface RelayClientOptions {
  provider?: JsonRpcProvider;
  providerOpts?: any;
}

export interface RelayUserOptions {
  default?: string;
  [relay: string]: any;
}

export interface RelayClients {
  [relay: string]: IRelayClient;
}
