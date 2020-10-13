import { WalletConnectClient } from "../../types";

export abstract class AbstractController {
  // tracks pending
  public abstract pending: any[];
  // tracks active
  public abstract active: any[];

  constructor(public client: WalletConnectClient) {}

  // called by the initiator
  public abstract propose(opts: any): Promise<any>;
  // called by the responder
  public abstract respond(opts: any): Promise<any>;
  // called by both after successful connection
  public abstract create(opts: any): Promise<any>;
  // called by either when disconnecting
  public abstract delete(opts: any): Promise<any>;

  // callback for propose response
  public abstract onResponse(topic: string, response: any): Promise<any>;
  // callback for respond acknowledge
  public abstract onAcknowledge(topic: string, response: any): Promise<any>;
}
