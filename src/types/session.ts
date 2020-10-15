import { IClient, IProtocol, ISubscription } from "./client";
import { KeyPair } from "./crypto";

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

  public abstract propose(params?: SessionProposeParams): Promise<SessionProposal>;

  public abstract respond(params: SessionRespondParams): Promise<SessionResponded>;

  public abstract create(params: SessionCreateParams): Promise<SessionCreated>;

  public abstract delete(params: SessionDeleteParams): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  protected abstract onResponse(topic: string, message: string): Promise<void>;

  protected abstract onAcknowledge(topic: string, message: string): Promise<void>;

  protected abstract onMessage(topic: string, message: string): Promise<void>;
}
