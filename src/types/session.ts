import { ISequence } from "./sequence";
import { KeyPair } from "./crypto";
import { RelayProtocolOptions } from "./relay";
export declare namespace SessionTypes {
  export interface ProposeParams {
    connection: { topic: string };
    relay: RelayProtocolOptions;
    stateParams: StateParams;
    ruleParams: RuleParams;
    metadata: Metadata;
  }

  export type CreateParams = ProposeParams;

  export interface Proposal {
    topic: string;
    relay: RelayProtocolOptions;
    peer: Peer;
    stateParams: StateParams;
    ruleParams: RuleParams;
    connection: { topic: string };
  }

  export interface Proposed extends Proposal {
    keyPair: KeyPair;
  }

  export interface RespondParams {
    approved: boolean;
    state: State;
    metadata: Metadata;
    proposal: Proposal;
  }

  export interface Responded extends Proposal {
    outcome: Outcome;
  }
  export interface SettleParams {
    relay: RelayProtocolOptions;
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

  export interface Settled {
    relay: RelayProtocolOptions;
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

  export interface WriteAccessParams {
    [key: string]: {
      proposer: boolean;
      responder: boolean;
    };
  }

  export interface RuleParams {
    state: WriteAccessParams;
    jsonrpc: string[];
  }

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
    relay: RelayProtocolOptions;
    publicKey: string;
    state: State;
  }
  export interface Failed {
    reason: string;
  }

  export type Outcome = Failed | Success;
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
