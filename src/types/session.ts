import { ISequence } from "./sequence";
import { KeyPair } from "./crypto";
export declare namespace SessionTypes {
  export interface Connection {
    topic: string;
    relay: string;
  }

  export interface ProposeParams {
    connection: Omit<Connection, "relay">;
    relay: string;
    stateParams: StateParams;
    metadata: Metadata;
    rules: Rules;
  }

  export type CreateParams = ProposeParams;

  export interface RespondParams {
    request: { id: number };
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
    connection: Connection;
    keyPair: KeyPair;
    proposal: Proposal;
  }

  export interface Proposal {
    connection: Connection;
    relay: string;
    peer: Peer;
    stateParams: StateParams;
    rules: Rules;
  }

  export interface Settled {
    relay: string;
    topic: string;
    symKey: string;
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
  }
  export interface Failed {
    reason: string;
  }

  export type Outcome = Failed | Success;

  export interface Responded extends Proposal {
    request: { id: number };
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
