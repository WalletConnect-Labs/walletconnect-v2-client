import * as safeJsonUtils from "safe-json-utils";
import * as jsonRpcUtils from "rpc-json-utils";

import { sha256 } from "./crypto";
import { KeyValue } from "../client/controllers";

// -- JSON -------------------------------------------------- //

export const safeJsonParse = safeJsonUtils.safeJsonParse;

export const safeJsonStringify = safeJsonUtils.safeJsonStringify;

// -- id -------------------------------------------------- //

export const payloadId = jsonRpcUtils.payloadId;

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

export function mapKeyValue<A = any, B = any>(obj: KeyValue<A>, cb: (x: A) => B): KeyValue<B> {
  const res = {};
  Object.keys(obj).forEach(key => {
    res[key] = cb(obj[key]);
  });
  return res;
}
