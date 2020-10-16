import { IClient } from "./client";
import { ISequence } from "./sequence";
import { ISubscription } from "./subscription";
import { KeyPair } from "./crypto";
import { MessageEvent } from "./events";

export interface ConnectionProposeParams {
  relay: string;
}

export type ConnectionCreateParams = ConnectionProposeParams;

export interface ConnectionRespondParams {
  approved: boolean;
  proposal: ConnectionProposal;
}

export interface ConnectionSettleParams {
  relay: string;
  privateKey: string;
  publicKey: string;
}
export interface ConnectionDeleteParams {
  topic: string;
  reason: string;
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

export interface ConnectionSettled {
  relay: string;
  topic: string;
  symKey: string;
}

export interface ConnectionFailed {
  reason: string;
}

export type ConnectionOutcome = ConnectionFailed | ConnectionSettled;

export interface ConnectionResponded extends ConnectionProposal {
  outcome: ConnectionOutcome;
}

export interface ConnectionMetadata {
  os: string;
  env: string;
}

export abstract class IConnection extends ISequence {
  public abstract proposed: ISubscription<ConnectionProposed>;
  public abstract responded: ISubscription<ConnectionResponded>;
  public abstract settled: ISubscription<ConnectionSettled>;

  constructor(public client: IClient) {
    super(client);
  }

  public abstract create(params?: ConnectionCreateParams): Promise<ConnectionSettled>;
  public abstract respond(params: ConnectionRespondParams): Promise<ConnectionResponded>;
  public abstract delete(params: ConnectionDeleteParams): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract propose(params?: ConnectionProposeParams): Promise<ConnectionProposal>;
  protected abstract settle(params: ConnectionSettleParams): Promise<ConnectionSettled>;

  protected abstract onResponse(messageEvent: MessageEvent): Promise<void>;
  protected abstract onAcknowledge(messageEvent: MessageEvent): Promise<void>;
  protected abstract onMessage(messageEvent: MessageEvent): Promise<void>;
}
