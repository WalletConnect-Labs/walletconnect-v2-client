export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export interface EncryptedMessage {
  iv: string;
  mac: string;
  data: string;
}

export interface EncryptParams {
  message: string;
  sharedKey: string;
  publicKey: string;
}

export interface DecryptParams {
  encrypted: EncryptedMessage;
  sharedKey: string;
  publicKey: string;
}
