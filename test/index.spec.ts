import WalletConnectClient from "../src";

describe("WalletConnectClient", () => {
  it("instantiate successfully", () => {
    const client = new WalletConnectClient();
    expect(client).toBeTruthy();
  });
});
