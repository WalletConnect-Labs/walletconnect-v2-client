export const SESSION_JSONRPC = {
  propose: "wc_proposeSession",
  respond: "wc_respondSession",
  update: "wc_updateSession",
  delete: "wc_deleteSession",
};

export const SESSION_JSONRPC_BEFORE_SETTLEMENT = [SESSION_JSONRPC.propose, SESSION_JSONRPC.respond];

export const SESSION_JSONRPC_AFTER_SETTLEMENT = [SESSION_JSONRPC.update, SESSION_JSONRPC.delete];

export const SESSION_CONTEXT = "session";

export const SESSION_STATUS = {
  proposed: "proposed",
  responded: "responded",
  settled: "settled",
};

export const SESSION_EVENTS = {
  message: "session_message",
  proposed: "session_proposed",
  responded: "session_responded",
  settled: "session_settled",
  updated: "session_updated",
  deleted: "session_deleted",
};

export const SESSION_REASONS = {
  settled: "Session settled",
  not_approved: "Session not approved",
  responded: "Session proposal responded",
  acknowledged: "Session response acknowledged",
};
