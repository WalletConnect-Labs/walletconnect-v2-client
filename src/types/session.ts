import { ISequence } from "./sequence";
import { KeyPair } from "./crypto";
export declare namespace SessionTypes {
  export interface Connection {
    topic: string;
  }

  export interface ProposeParams {
    connection: Connection;
    relay: string;
    stateParams: StateParams;
    metadata: Metadata;
    rules: Rules;
  }

  export type CreateParams = ProposeParams;

  export interface RespondParams {
    approved: boolean;
    state: State;
    metadata: Metadata;
    proposal: Proposal;
  }
  export interface SettleParams {
    relay: string;
    keyPair: KeyPair;
    peer: Peer;
    state: State;
    rules: Rules;
  }

  export interface UpdateParams {
    topic: string;
    state?: State;
    metadata?: Metadata;
  }

  export type Update = { state: State } | { metadata: Metadata };
  export interface DeleteParams {
    topic: string;
    reason: string;
  }

  export interface Proposed {
    topic: string;
    relay: string;
    keyPair: KeyPair;
    proposal: Proposal;
  }

  export interface Proposal {
    topic: string;
    relay: string;
    peer: Peer;
    stateParams: StateParams;
    rules: Rules;
    connection: Connection;
  }

  export interface Settled {
    relay: string;
    topic: string;
    sharedKey: string;
    keyPair: KeyPair;
    peer: Peer;
    state: State;
    rules: Rules;
  }

  export interface Peer {
    publicKey: string;
    metadata: Metadata;
  }

  export interface Metadata {
    name: string;
    description: string;
    url: string;
    icons: string[];
  }

  export interface StateParams {
    chains: string[];
  }

  export interface State {
    accounts: string[];
  }

  export interface WriteAccess {
    [key: string]: {
      [publicKey: string]: boolean;
    };
  }

  export interface Rules {
    peer: WriteAccess;
    state: WriteAccess;
    jsonrpc: string[];
  }

  export interface Success {
    topic: string;
    relay: string;
    publicKey: string;
    state: State;
  }
  export interface Failed {
    reason: string;
  }

  export type Outcome = Failed | Success;

  export interface Responded extends Omit<Proposal, "stateParams"> {
    outcome: Outcome;
  }
}

export abstract class ISession extends ISequence<
  SessionTypes.Proposed,
  SessionTypes.Proposal,
  SessionTypes.Responded,
  SessionTypes.Settled,
  SessionTypes.Update,
  SessionTypes.CreateParams,
  SessionTypes.RespondParams,
  SessionTypes.UpdateParams,
  SessionTypes.DeleteParams,
  SessionTypes.ProposeParams,
  SessionTypes.SettleParams
> {}
