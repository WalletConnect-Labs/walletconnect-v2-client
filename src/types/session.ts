import { ISequence } from "./sequence";
import { KeyPair } from "./crypto";

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
  peer: SessionPeer;
  keyPair: KeyPair;
}

export interface SessionUpdateParams {
  topic: string;
  state?: SessionState;
  metadata?: SessionMetadata;
}

export type SessionUpdate = { state: SessionState } | { metadata: SessionMetadata };
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
  permissions: SessionRules;
  peer: SessionPeer;
}

export interface SessionSettled {
  relay: string;
  topic: string;
  symKey: string;
  keyPair: KeyPair;
  peer: SessionPeer;
  state: SessionState;
  rules: SessionRules;
}

export interface SessionPeer {
  publicKey: string;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface SessionState {
  accounts: string[];
}

export interface SessionWriteAccess {
  [key: string]: {
    [publicKey: string]: boolean;
  };
}

export interface SessionRules {
  peer: SessionWriteAccess;
  state: SessionWriteAccess;
  jsonrpc: string[];
}

export interface SessionSuccess {
  topic: string;
  relay: string;
}
export interface SessionFailed {
  reason: string;
}

export type SessionOutcome = SessionFailed | SessionSuccess;

export interface SessionResponded extends SessionProposal {
  outcome: SessionOutcome;
}

export abstract class ISession extends ISequence<
  SessionProposed,
  SessionProposal,
  SessionResponded,
  SessionSettled,
  SessionUpdate,
  SessionCreateParams,
  SessionRespondParams,
  SessionUpdateParams,
  SessionDeleteParams,
  SessionProposeParams,
  SessionSettleParams
> {}
