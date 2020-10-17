import { ISequence } from "./sequence";
import { KeyPair } from "./crypto";

export declare namespace ConnectionTypes {
  export interface ProposeParams {
    relay: string;
  }

  export type CreateParams = ConnectionTypes.ProposeParams;

  export interface RespondParams {
    approved: boolean;
    proposal: ConnectionTypes.Proposal;
  }

  export interface SettleParams {
    relay: string;
    peer: ConnectionTypes.Peer;
    keyPair: KeyPair;
  }

  export interface UpdateParams {
    topic: string;
    state?: ConnectionTypes.State;
    metadata?: ConnectionTypes.Metadata;
  }

  export type Update = { state: ConnectionTypes.State } | { metadata: ConnectionTypes.Metadata };
  export interface DeleteParams {
    topic: string;
    reason: string;
  }

  export interface Proposed {
    relay: string;
    topic: string;
    keyPair: KeyPair;
  }

  export interface Proposal {
    relay: string;
    topic: string;
    publicKey: string;
  }

  export interface Settled {
    relay: string;
    topic: string;
    symKey: string;
    keyPair: KeyPair;
    peer: ConnectionTypes.Peer;
    state: ConnectionTypes.State;
    rules: ConnectionTypes.Rules;
  }

  export interface Peer {
    publicKey: string;
    metadata?: ConnectionTypes.Metadata;
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
    state: ConnectionTypes.WriteAccess;
    jsonrpc: string[];
  }

  export interface Success {
    topic: string;
    relay: string;
  }
  export interface Failed {
    reason: string;
  }

  export type Outcome = ConnectionTypes.Failed | ConnectionTypes.Success;

  export interface Responded extends ConnectionTypes.Proposal {
    outcome: ConnectionTypes.Outcome;
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
