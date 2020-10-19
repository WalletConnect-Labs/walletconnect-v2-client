import * as JsonRpcUtils from "rpc-json-utils";

import { ConnectionTypes, SessionTypes } from "../types";

export const isJsonRpcRequest = JsonRpcUtils.isJsonRpcRequest;

export const isJsonRpcResponse = JsonRpcUtils.isJsonRpcResponse;

export const isJsonRpcResult = JsonRpcUtils.isJsonRpcResult;

export const isJsonRpcError = JsonRpcUtils.isJsonRpcError;

export function isConnectionFailed(
  outcome: ConnectionTypes.Outcome,
): outcome is ConnectionTypes.Failed {
  return "reason" in outcome;
}

export function isSessionFailed(outcome: SessionTypes.Outcome): outcome is SessionTypes.Failed {
  return "reason" in outcome;
}
