import { IClient } from "./client";
import { IEvents } from "./events";
import { ISubscription, SubscriptionEvent } from "./subscription";

export abstract class ISequence<
  Proposed,
  Proposal,
  Responded,
  Settled,
  Update,
  CreateParams,
  RespondParams,
  UpdateParams,
  DeleteParams,
  ProposeParams,
  SettleParams
> extends IEvents {
  // proposed subscriptions
  public abstract proposed: ISubscription<Proposed>;
  // responded subscriptions
  public abstract responded: ISubscription<Responded>;
  // settled subscriptions
  public abstract settled: ISubscription<Settled>;
  // returns settled subscriptions length
  public abstract readonly length: number;
  // returns settled subscriptions entries
  public abstract readonly entries: Record<string, Settled>;
  // describes sequence context
  protected abstract context: string;

  constructor(public client: IClient) {
    super();
  }

  // initialize with persisted state
  public abstract init(): Promise<void>;

  // called by proposer
  public abstract create(params?: CreateParams): Promise<Settled>;
  // called by responder
  public abstract respond(params: RespondParams): Promise<Responded>;
  // called by either to update state
  public abstract update(params: UpdateParams): Promise<Settled>;
  // called by either to terminate
  public abstract delete(params: DeleteParams): Promise<void>;

  // ---------- Protected ----------------------------------------------- //

  // called by proposer (internally)
  protected abstract propose(params?: ProposeParams): Promise<Proposal>;
  // called by both (internally)
  protected abstract settle(params: SettleParams): Promise<Settled>;

  // callback for proposed subscriptions
  protected abstract onResponse(payloadEvent: SubscriptionEvent.Payload): Promise<void>;
  // callback for responded subscriptions
  protected abstract onAcknowledge(payloadEvent: SubscriptionEvent.Payload): Promise<void>;
  // callback for settled subscriptions
  protected abstract onMessage(payloadEvent: SubscriptionEvent.Payload): Promise<void>;
  // callback for state update requests
  protected abstract onUpdate(payloadEvent: SubscriptionEvent.Payload): Promise<void>;
  // validates and processes state udpates
  protected abstract handleUpdate(
    settled: Settled,
    params: UpdateParams,
    fromPeer?: boolean,
  ): Promise<Update>;
}
