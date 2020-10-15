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

export abstract class IConnection extends IProtocol {
  public abstract proposed: ISubscription<ConnectionProposed>;
  public abstract created: ISubscription<ConnectionCreated>;

  constructor(public client: IClient) {
    super(client);
  }

  public abstract propose(opts?: ConnectionProposeOptions): Promise<string>;

  public abstract respond(opts: ConnectionRespondOptions): Promise<string>;

  public abstract create(opts: ConnectionCreateOptions): Promise<ConnectionCreated>;

  public abstract delete(opts: ConnectionDeleteOptions): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onResponse(topic: string, message: string): Promise<void>;

  protected abstract onMessage(topic: string, message: string): Promise<void>;
}
