import { IClient, IProtocol, ISubscription } from "./client";
import { KeyPair } from "./crypto";

export interface ConnectionProposeOptions {
  relay: string;
}

export interface ConnectionRespondOptions {
  uri: string;
}
export interface ConnectionCreateOptions {
  relay: string;
  privateKey: string;
  publicKey: string;
}
export interface ConnectionDeleteOptions {
  topic: string;
}

export interface ConnectionProposed {
  relay: string;
  topic: string;
  keyPair: KeyPair;
}

export interface ConnectionProposal {
  relay: string;
  topic: string;
  publicKey: string;
}

export interface ConnectionCreated {
  relay: string;
  topic: string;
  symKey: string;
}

export interface ConnectionMetadata {
  os: string;
  env: string;
}

export abstract class IConnection implements IProtocol {
  public abstract proposed: ISubscription<ConnectionProposed>;
  public abstract created: ISubscription<ConnectionCreated>;

  constructor(public client: IClient) {
    // empty
  }

  public abstract propose(opts?: ConnectionProposeOptions): Promise<string>;

  public abstract respond(opts: ConnectionRespondOptions): Promise<string>;

  public abstract create(opts: ConnectionCreateOptions): Promise<ConnectionCreated>;

  public abstract delete(opts: ConnectionDeleteOptions): Promise<void>;

  public abstract onResponse(payload: any): Promise<void>;

  public abstract onMessage(payload: any): Promise<void>;
}
