import * as eccryptoJS from "eccrypto-js";
import * as encUtils from "enc-utils";

import { DecryptParams, EncryptedMessage, EncryptParams, KeyPair } from "../types";

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
    eccryptoJS.derive(
      encUtils.hexToBuffer(privateKeyA),
      eccryptoJS.decompress(encUtils.hexToBuffer(publicKeyB)),
    ),
  );
}

export async function sha256(msg: string): Promise<string> {
  return encUtils.bufferToHex(await eccryptoJS.sha256(encUtils.hexToBuffer(msg)));
}

async function getEciesKeys(sharedKeyHex: string, publicKeyHex: string) {
  const publicKey = encUtils.hexToBuffer(publicKeyHex);
  const hash = await eccryptoJS.sha512(encUtils.hexToBuffer(sharedKeyHex));
  const key = Buffer.from(hash.slice(eccryptoJS.LENGTH_0, eccryptoJS.KEY_LENGTH));
  const macKey = Buffer.from(hash.slice(eccryptoJS.KEY_LENGTH));
  return { publicKey, key, macKey };
}

export async function encrypt(params: EncryptParams): Promise<EncryptedMessage> {
  const { publicKey, key, macKey } = await getEciesKeys(params.sharedKey, params.publicKey);
  const iv = eccryptoJS.randomBytes(eccryptoJS.IV_LENGTH);
  const msg = encUtils.utf8ToBuffer(params.message);
  const data = await eccryptoJS.aesCbcEncrypt(iv, key, msg);
  const dataToMac = encUtils.concatBuffers(iv, publicKey, data);
  const mac = await eccryptoJS.hmacSha256Sign(macKey, dataToMac);
  return {
    iv: encUtils.bufferToHex(iv),
    mac: encUtils.bufferToHex(mac),
    data: encUtils.bufferToHex(data),
  };
}

function parseEncryptedMessage(
  encrypted: EncryptedMessage,
): { iv: Buffer; mac: Buffer; data: Buffer } {
  return {
    iv: encUtils.hexToBuffer(encrypted.iv),
    mac: encUtils.hexToBuffer(encrypted.mac),
    data: encUtils.hexToBuffer(encrypted.data),
  };
}

export async function decrypt(params: DecryptParams): Promise<string> {
  const { publicKey, key, macKey } = await getEciesKeys(params.sharedKey, params.publicKey);
  const { iv, mac, data } = parseEncryptedMessage(params.encrypted);
  const dataToMac = encUtils.concatBuffers(iv, publicKey, data);
  const macTest = await eccryptoJS.hmacSha256Verify(macKey, dataToMac, mac);
  eccryptoJS.assert(macTest, eccryptoJS.ERROR_BAD_MAC);
  const msg = await eccryptoJS.aesCbcDecrypt(iv, key, data);
  return encUtils.bufferToUtf8(msg);
}
