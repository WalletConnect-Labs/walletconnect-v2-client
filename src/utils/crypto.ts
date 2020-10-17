import * as eccryptoJS from "eccrypto-js";
import * as encUtils from "enc-utils";

import { KeyPair } from "../types";

export function generateKeyPair(): KeyPair {
  const keyPairBuffer = eccryptoJS.generateKeyPair();
  return {
    privateKey: encUtils.bufferToHex(keyPairBuffer.privateKey),
    publicKey: encUtils.bufferToHex(keyPairBuffer.publicKey),
  };
}

export function generateRandomBytes32(): string {
  return encUtils.bufferToHex(eccryptoJS.randomBytes(32));
}

export function deriveSharedKey(privateKeyA: string, publicKeyB: string): string {
  return encUtils.bufferToHex(
    eccryptoJS.derive(encUtils.hexToBuffer(privateKeyA), encUtils.hexToBuffer(publicKeyB)),
  );
}

export async function sha256(msg: string): Promise<string> {
  return encUtils.bufferToHex(await eccryptoJS.sha256(encUtils.hexToBuffer(msg)));
}
