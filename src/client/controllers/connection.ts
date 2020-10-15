import { EventEmitter } from "events";

import {
  IClient,
  ConnectionProposed,
  ConnectionCreated,
  ConnectionProposal,
  IConnection,
  ConnectionProposeOptions,
  ConnectionRespondOptions,
  ConnectionCreateOptions,
  ConnectionDeleteOptions,
} from "../../types";
import {
  generateKeyPair,
  parseUri,
  formatUri,
  deriveSharedKey,
  sha256,
  formatJsonRpcRequest,
  assertType,
  generateTopic,
  formatJsonRpcError,
  formatJsonRpcResult,
  safeJsonParse,
} from "../../utils";
import { Subscription } from "./subscription";

export class Connection extends IConnection {
  public proposed: Subscription<ConnectionProposed>;
  public created: Subscription<ConnectionCreated>;

  private events = new EventEmitter();

  constructor(public client: IClient) {
    super(client);
    this.proposed = new Subscription<ConnectionProposed>(client, "proposed");
    this.proposed.on("message", ({ topic, message }) => this.onResponse(topic, message));
    this.created = new Subscription<ConnectionCreated>(client, "created");
    this.created.on("message", ({ topic, message }) => this.onMessage(topic, message));
  }

  public async propose(opts?: ConnectionProposeOptions): Promise<string> {
    const relay = opts?.relay || this.client.relay.default;
    const setup: ConnectionProposed = {
      relay,
      topic: await generateTopic(),
      keyPair: generateKeyPair(),
    };
    await this.proposed.set(setup.topic, setup);

    const proposal: ConnectionProposal = {
      relay: setup.relay,
      publicKey: setup.keyPair.publicKey,
    };
    return formatUri(this.client.protocol, this.client.version, setup.topic, proposal);
  }

  public async respond(opts: ConnectionRespondOptions) {
    const uriParams = parseUri(opts.uri) as ConnectionProposal & { topic: string };
    assertType(uriParams, "publicKey", "string");
    const keyPair = generateKeyPair();
    const topic = uriParams.topic;
    const relay = uriParams.relay;
    const connection = await this.create({
      relay,
      privateKey: keyPair.privateKey,
      publicKey: uriParams.publicKey,
    });
    this.publishResponse(topic, uriParams, connection);
    return connection.topic;
  }

  public async create(opts: ConnectionCreateOptions) {
    const symKey = deriveSharedKey(opts.privateKey, opts.publicKey);
    const connection: ConnectionCreated = {
      relay: opts.relay,
      symKey,
      topic: await sha256(symKey),
    };
    await this.created.set(connection.topic, connection);
    return connection;
  }

  public async delete(opts: ConnectionDeleteOptions) {
    // TODO: implement delete
  }

  // ---------- Protected ----------------------------------------------- //

  protected async onResponse(topic: string, message: string): Promise<void> {
    const request = safeJsonParse(message);
    const proposed = await this.proposed.get(topic);
    try {
      assertType(request, "publicKey", "string");
      await this.create({
        relay: request.relay,
        privateKey: proposed.keyPair.privateKey,
        publicKey: request.publicKey,
      });
      const response = formatJsonRpcResult(request.id, true);
      this.client.relay.publish(topic, JSON.stringify(response), proposed.relay);
    } catch (e) {
      const response = formatJsonRpcError(request.id, e.message);
      this.client.relay.publish(topic, JSON.stringify(response), proposed.relay);
    }
    await this.proposed.del(topic);
  }

  protected async onMessage(topic: string, message: string): Promise<void> {
    this.events.emit("message", { topic, message });
  }

  // ---------- Private ----------------------------------------------- //

  private async publishResponse(
    topic: string,
    proposal: ConnectionProposal,
    connection: ConnectionCreated,
  ) {
    const request = formatJsonRpcRequest("wc_respondConnection", { publicKey: proposal.publicKey });
    this.client.relay.publish(topic, JSON.stringify(request), proposal.relay);
    this.client.relay.subscribe(
      topic,
      (response: any) => {
        if (response.error) {
          this.created.del(connection.topic);
        }
      },
      proposal.relay,
    );
  }
}
