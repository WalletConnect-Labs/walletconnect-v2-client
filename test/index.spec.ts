import Client from "../src";

const TEST_BRIDGE_RPC_URL = "http://localhost:5555";

const TEST_SESSION_PARAMS = {
  accounts: ["0x1d85568eEAbad713fBB5293B45ea066e552A90De@eip155:1"],
};

describe("Client", () => {
  it("instantiate successfully", () => {
    const connector = new Client({
      relay: {
        opts: {
          bridge: TEST_BRIDGE_RPC_URL,
        },
      },
    });
    expect(connector).toBeTruthy();
  });

  it("connect two clients", async () => {
    const connectorA = new Client({
      relay: {
        opts: {
          bridge: TEST_BRIDGE_RPC_URL,
        },
      },
    });

    await Promise.all([
      new Promise((resolve, reject) => {
        connectorA.on("connect", error => {
          if (error) {
            reject(error);
          }

          expect(connectorA.connected).toBeTruthy();
          expect(connectorA.accounts).toEqual(TEST_SESSION_PARAMS.accounts);
          resolve();
        });
      }),
      new Promise((resolve, reject) => {
        connectorA.on("display_uri", (error, payload) => {
          if (error) {
            reject(error);
          }

          const uri = payload.params[0];

          const connectorB = new Client({ uri });

          // Subscribe to session requests
          connectorB.on("session_request", error => {
            if (error) {
              reject(error);
            }

            connectorB.approveSession(TEST_SESSION_PARAMS);

            expect(connectorB.connected).toBeTruthy();
            expect(connectorB.accounts).toEqual(TEST_SESSION_PARAMS.accounts);
            resolve();
          });
        });
      }),
      new Promise(resolve => {
        connectorA.createSession();
        resolve();
      }),
    ]);
  });
});
