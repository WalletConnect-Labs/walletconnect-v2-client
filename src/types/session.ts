import { IClient } from "./client";
import { ISequence } from "./sequence";
import { ISubscription } from "./subscription";
import { KeyPair } from "./crypto";
import { MessageEvent } from "./events";

export interface SessionProposeParams {
  relay: string;
}
export interface SessionRespondParams {
  approved: boolean;
  proposal: SessionProposal;
}
export interface SessionCreateParams {
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

export interface SessionResponded extends SessionProposal {
  connection: SessionCreated;
}

export interface SessionCreated {
  relay: string;
  topic: string;
  symKey: string;
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
  public abstract created: ISubscription<SessionCreated>;

  constructor(public client: IClient) {
    super(client);
  }

  public abstract propose(params?: SessionProposeParams): Promise<SessionProposal>;

  public abstract respond(params: SessionRespondParams): Promise<SessionResponded>;

  public abstract create(params: SessionCreateParams): Promise<SessionCreated>;

  public abstract delete(params: SessionDeleteParams): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onResponse(messageEvent: MessageEvent): Promise<void>;

  protected abstract onAcknowledge(messageEvent: MessageEvent): Promise<void>;

  protected abstract onMessage(messageEvent: MessageEvent): Promise<void>;
}
