import * as safeJsonUtils from "safe-json-utils";
import * as jsonRpcUtils from "rpc-json-utils";

import { sha256 } from "./crypto";
import { KeyValue } from "../client/controllers";

// -- JSON -------------------------------------------------- //

export const safeJsonParse = safeJsonUtils.safeJsonParse;

export const safeJsonStringify = safeJsonUtils.safeJsonStringify;

// -- id -------------------------------------------------- //

export const payloadId = jsonRpcUtils.payloadId;

export function uuid(): string {
  const result: string = ((a?: any, b?: any) => {
    for (
      b = a = "";
      a++ < 36;
      b += (a * 51) & 52 ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16) : "-"
    ) {
      // empty
    }
    return b;
  })();
  return result;
}

export async function generateTopic(): Promise<string> {
  return await sha256(uuid());
}

// -- assert ------------------------------------------------- //

export function assertType(obj: any, key: string, type: string) {
  if (!obj[key] || typeof obj[key] !== type) {
    throw new Error(`Missing or invalid "${key}" param`);
  }
}

// -- map ------------------------------------------------- //

export function mapToObj<T = any>(map: Map<string, T>): KeyValue<T> {
  return Object.fromEntries(map.entries());
}

export function objToMap<T = any>(obj: KeyValue<T>): Map<string, T> {
  return new Map<string, T>(Object.entries<T>(obj));
}
