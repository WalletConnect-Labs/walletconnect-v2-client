import { IClient, IProtocol, ISubscription } from "./client";
import { KeyPair } from "./crypto";

export interface ConnectionProposeParams {
  relay: string;
}

export interface ConnectionRespondParams {
  approved: boolean;
  proposal: ConnectionProposal;
}
export interface ConnectionCreateParams {
  relay: string;
  privateKey: string;
  publicKey: string;
}
export interface ConnectionDeleteParams {
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

export interface ConnectionResponded extends ConnectionProposal {
  connection: ConnectionCreated;
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
  public abstract responded: ISubscription<ConnectionResponded>;
  public abstract created: ISubscription<ConnectionCreated>;

  constructor(public client: IClient) {
    super(client);
  }

  public abstract propose(params?: ConnectionProposeParams): Promise<ConnectionProposal>;

  public abstract respond(params: ConnectionRespondParams): Promise<ConnectionResponded>;

  public abstract create(params: ConnectionCreateParams): Promise<ConnectionCreated>;

  public abstract delete(params: ConnectionDeleteParams): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onResponse(topic: string, message: string): Promise<void>;

  protected abstract onAcknowledge(topic: string, message: string): Promise<void>;

  protected abstract onMessage(topic: string, message: string): Promise<void>;
}
