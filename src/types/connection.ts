import { ISequence } from "./sequence";
import { KeyPair } from "./crypto";

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
  peer: ConnectionPeer;
  keyPair: KeyPair;
}

export interface ConnectionUpdateParams {
  topic: string;
  state?: ConnectionState;
  metadata?: ConnectionMetadata;
}

export type ConnectionUpdate = { state: ConnectionState } | { metadata: ConnectionMetadata };
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
  keyPair: KeyPair;
  peer: ConnectionPeer;
  state: ConnectionState;
  rules: ConnectionRules;
}

export interface ConnectionPeer {
  publicKey: string;
  metadata?: ConnectionMetadata;
}

export interface ConnectionMetadata {
  type: string;
  platform: string;
  version: string;
  os: string;
}

// eslint-disable-next-line
export interface ConnectionState {}

export interface ConnectionWriteAccess {
  [key: string]: {
    [publicKey: string]: boolean;
  };
}

export interface ConnectionRules {
  state: ConnectionWriteAccess;
  jsonrpc: string[];
}

export interface ConnectionSuccess {
  topic: string;
  relay: string;
}
export interface ConnectionFailed {
  reason: string;
}

export type ConnectionOutcome = ConnectionFailed | ConnectionSuccess;

export interface ConnectionResponded extends ConnectionProposal {
  outcome: ConnectionOutcome;
}

export abstract class IConnection extends ISequence<
  ConnectionProposed,
  ConnectionProposal,
  ConnectionResponded,
  ConnectionSettled,
  ConnectionUpdate,
  ConnectionCreateParams,
  ConnectionRespondParams,
  ConnectionUpdateParams,
  ConnectionDeleteParams,
  ConnectionProposeParams,
  ConnectionSettleParams
> {}
