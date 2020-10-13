import { AbstractController } from "./abstract";

import { WalletConnectClient, SessionPending, SessionActive } from "../../types";

export class SessionController implements AbstractController {
  public pending: SessionPending[] = [];
  public active: SessionActive[] = [];

  constructor(public client: WalletConnectClient) {}

  public async propose() {}

  public async respond() {}

  public async create(uri: string) {}

  public async delete() {}

  public async onResponse(topic: string, response: any) {}

  public async onAcknowledge(topic: string, response: any) {}
}
