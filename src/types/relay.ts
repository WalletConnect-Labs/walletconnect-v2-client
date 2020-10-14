import { JsonRpcProvider } from "./jsonrpc";

export abstract class IRelayClient {
  public abstract provider: JsonRpcProvider;

  constructor(relayOptions?: RelayClientOptions) {}

  public abstract init();

  public abstract publish(topic: string, message: string);

  public abstract subscribe(topic: string, listener: (...args: any[]) => void): any;

  public abstract unsubscribe(topic: string, listener: (...args: any[]) => void): any;
}

export abstract class IRelayController {
  public abstract default: string;
  public abstract clients: RelayClients;

  constructor(opts: RelayUserOptions = {}) {}

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
