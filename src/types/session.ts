import { IClient, IProtocolController, ISubscriptionController } from "./client";

export interface SessionProposeOptions {}
export interface SessionRespondOptions {}
export interface SessionCreateOptions {}
export interface SessionDeleteOptions {}

export abstract class ISessionController implements IProtocolController {
  public abstract proposed: ISubscriptionController<SessionProposed>;
  public abstract created: ISubscriptionController<SessionCreated>;

  constructor(public client: IClient) {}

  public abstract propose(opts?: SessionProposeOptions): Promise<void>;

  public abstract respond(opts: SessionRespondOptions): Promise<void>;

  public abstract create(opts: SessionCreateOptions): Promise<void>;

  public abstract delete(opts: SessionDeleteOptions): Promise<void>;

  public abstract onResponse(payload: any): Promise<void>;

  public abstract onMessage(payload: any): Promise<void>;
}

export interface SessionProposed {}

export interface SessionProposal {}

export interface SessionCreated {}

export interface SessionMetadata {}