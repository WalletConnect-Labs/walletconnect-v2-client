import { IClient } from "./client";
import { ISequence } from "./sequence";
import { ISubscription } from "./subscription";
import { KeyPair } from "./crypto";
import { MessageEvent } from "./events";
export interface SessionProposeParams {
  relay: string;
}

export type SessionCreateParams = SessionProposeParams;

export interface SessionRespondParams {
  approved: boolean;
  proposal: SessionProposal;
}
export interface SessionSettleParams {
  relay: string;
  privateKey: string;
  publicKey: string;
}
export interface SessionDeleteParams {
  topic: string;
  reason: string;
}

export interface SessionProposed {
  relay: string;
  topic: string;
  keyPair: KeyPair;
}

export interface SessionProposal {
  relay: string;
  topic: string;
  publicKey: string;
}

export interface SessionSettled {
  relay: string;
  topic: string;
  symKey: string;
}

export interface SessionFailed {
  reason: string;
}

export type SessionOutcome = SessionFailed | SessionSettled;

export interface SessionResponded extends SessionProposal {
  outcome: SessionOutcome;
}

export interface SessionMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export abstract class ISession extends ISequence {
  public abstract proposed: ISubscription<SessionProposed>;
  public abstract responded: ISubscription<SessionResponded>;
  public abstract settled: ISubscription<SessionSettled>;

  constructor(public client: IClient) {
    super(client);
  }

  public abstract create(params?: SessionCreateParams): Promise<SessionSettled>;
  public abstract respond(params: SessionRespondParams): Promise<SessionResponded>;
  public abstract delete(params: SessionDeleteParams): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract propose(params?: SessionProposeParams): Promise<SessionProposal>;
  protected abstract settle(params: SessionSettleParams): Promise<SessionSettled>;

  protected abstract onResponse(messageEvent: MessageEvent): Promise<void>;
  protected abstract onAcknowledge(messageEvent: MessageEvent): Promise<void>;
  protected abstract onMessage(messageEvent: MessageEvent): Promise<void>;
}
