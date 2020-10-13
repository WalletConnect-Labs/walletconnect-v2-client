import { KeyPair } from "./crypto";

export interface ConnectionPending {
  relay: string;
  topic: string;
  keyPair: KeyPair;
}

export interface ConnectionProposal {
  relay: string;
  publicKey: string;
}

export interface ConnectionActive {
  relay: string;
  topic: string;
  symKey: string;
}

export interface ConnectionMetadata {
  os: string;
  env: string;
}

export interface SessionPending {}

export interface SessionProposal {}

export interface SessionActive {}

export interface SessionMetadata {}
