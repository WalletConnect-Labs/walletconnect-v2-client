import { ISequence } from "./sequence";
import { KeyPair } from "./crypto";

export declare namespace ConnectionTypes {
  export interface ProposeParams {
    relay: string;
  }

  export type CreateParams = ProposeParams;

  export interface RespondParams {
    approved: boolean;
    proposal: Proposal;
  }

  export interface SettleParams {
    relay: string;
    peer: Peer;
    keyPair: KeyPair;
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
    relay: string;
    topic: string;
    keyPair: KeyPair;
    proposal: Proposal;
  }

  export interface Proposal {
    relay: string;
    topic: string;
    publicKey: string;
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
    metadata?: Metadata;
  }

  export interface Metadata {
    type: string;
    platform: string;
    version: string;
    os: string;
  }

  // eslint-disable-next-line
  export interface State {}

  export interface WriteAccess {
    [key: string]: {
      [publicKey: string]: boolean;
    };
  }

  export interface Rules {
    state: WriteAccess;
    jsonrpc: string[];
  }

  export interface Success {
    topic: string;
    relay: string;
    state: State;
  }
  export interface Failed {
    reason: string;
  }

  export type Outcome = Failed | Success;

  export interface Responded extends Proposal {
    outcome: Outcome;
  }
}

export abstract class IConnection extends ISequence<
  ConnectionTypes.Proposed,
  ConnectionTypes.Proposal,
  ConnectionTypes.Responded,
  ConnectionTypes.Settled,
  ConnectionTypes.Update,
  ConnectionTypes.CreateParams,
  ConnectionTypes.RespondParams,
  ConnectionTypes.UpdateParams,
  ConnectionTypes.DeleteParams,
  ConnectionTypes.ProposeParams,
  ConnectionTypes.SettleParams
> {}
