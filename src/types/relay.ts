import { JsonRpcProvider } from "./jsonrpc";

export abstract class RelayClient {
  public abstract provider: JsonRpcProvider;

  constructor(relayOptions?: RelayClientOptions) {}

  public abstract init();

  public abstract publish(topic: string, message: string);

  public abstract subscribe(topic: string, listener: (...args: any[]) => void): any;
}

export interface RelayClientOptions {
  provider?: JsonRpcProvider;
  providerOpts?: any;
}

export interface RelayUserOptions {
  default?: string;
  [relay: string]: any;
}

export interface RelaySetup {
  default: string;
  clients: {
    [relay: string]: RelayClient;
  };
}
