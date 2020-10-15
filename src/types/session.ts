import { IClient, IProtocol, ISubscription } from "./client";
import { KeyPair } from "./crypto";

export interface SessionProposeOptions {
  relay: string;
}
export interface SessionRespondOptions {
  relay: string;
  publicKey: string;
}
export interface SessionCreateOptions {
  topic: string;
}
export interface SessionDeleteOptions {
  topic: string;
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

export abstract class ISession extends IProtocol {
  public abstract proposed: ISubscription<SessionProposed>;
  public abstract responded: ISubscription<SessionResponded>;
  public abstract created: ISubscription<SessionCreated>;

  constructor(public client: IClient) {
    super(client);
  }

  public abstract propose(opts?: SessionProposeOptions): Promise<void>;

  public abstract respond(opts: SessionRespondOptions): Promise<void>;

  public abstract create(opts: SessionCreateOptions): Promise<void>;

  public abstract delete(opts: SessionDeleteOptions): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onResponse(topic: string, message: string): Promise<void>;

  protected abstract onAcknowledge(topic: string, message: string): Promise<void>;

  protected abstract onMessage(topic: string, message: string): Promise<void>;
}
