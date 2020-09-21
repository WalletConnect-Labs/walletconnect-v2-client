import { KeyPair } from "./crypto";

/**
 * @description Handshake describes pending key exchanges for connection prompts
 */
export interface Handshake {
  relay: string;
  topic: string;
  keyPair: KeyPair;
}

/**
 * @description Connection describes secure channel parameters between devices
 */
export interface Connection {
  relay: string;
  topic: string;
  symKey: string;
}

/**
 * @description Session describes session agreements betwen applications
 */
export interface Session {}
