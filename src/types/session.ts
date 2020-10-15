import { IClient, IProtocol, ISubscription } from "./client";

export interface SessionProposeOptions {
  topic: string;
}
export interface SessionRespondOptions {
  topic: string;
}
export interface SessionCreateOptions {
  topic: string;
}
export interface SessionDeleteOptions {
  topic: string;
}

export abstract class ISession implements IProtocol {
  public abstract proposed: ISubscription<SessionProposed>;
  public abstract created: ISubscription<SessionCreated>;

  constructor(public client: IClient) {
    // empty
  }

  public abstract propose(opts?: SessionProposeOptions): Promise<void>;

  public abstract respond(opts: SessionRespondOptions): Promise<void>;

  public abstract create(opts: SessionCreateOptions): Promise<void>;

  public abstract delete(opts: SessionDeleteOptions): Promise<void>;

  public abstract onResponse(payload: any): Promise<void>;

  public abstract onMessage(payload: any): Promise<void>;
}

export interface SessionProposed {
  topic: string;
}

export interface SessionProposal {
  topic: string;
}

export interface SessionCreated {
  topic: string;
}

export interface SessionMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}
