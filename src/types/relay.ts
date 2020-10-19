import { DecryptParams, EncryptParams } from "./crypto";
import { IEvents } from "./events";
import { IJsonRpcProvider, JsonRpcPayload } from "./jsonrpc";

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

export interface RelayPublishOptions {
  relay?: string;
  encrypt?: Omit<EncryptParams, "message">;
}
export interface RelaySubscribeOptions {
  relay?: string;
  decrypt?: Omit<DecryptParams, "encrypted">;
}
export abstract class IRelay extends IEvents {
  public abstract default: string;
  public abstract clients: RelayClients;

  constructor(opts: RelayUserOptions = {}) {
    super();
  }

  public abstract init(opts?: RelayUserOptions): Promise<void>;

  public abstract publish(topic: string, payload: JsonRpcPayload, opts?: RelayPublishOptions): any;

  public abstract subscribe(
    topic: string,
    listener: (payload: JsonRpcPayload) => void,
    opts?: RelaySubscribeOptions,
  ): any;

  public abstract unsubscribe(
    topic: string,
    listener: (payload: JsonRpcPayload) => void,
    opts?: RelaySubscribeOptions,
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
