import { ConnectionOutcome, ConnectionFailed, SessionOutcome, SessionFailed } from "../types";

export function isConnectionFailed(outcome: ConnectionOutcome): outcome is ConnectionFailed {
  return "reason" in outcome;
}

export function isSessionFailed(outcome: SessionOutcome): outcome is SessionFailed {
  return "reason" in outcome;
}
