import * as detectEnv from "detect-browser";
import * as WindowMetadata from "window-metadata";

import { ConnectionTypes, SessionTypes } from "../types";

export function getConnectionType(type: string): string {
  switch (type) {
    case "react-native":
      return "mobile";
    case "browser":
      return "browser";
    case "node":
      return "desktop";
    default:
      return "";
  }
}

export function getConnectionMetadata(): ConnectionTypes.Metadata | null {
  const env = detectEnv.detect();
  if (env === null) return null;
  if (env.type === "bot" || env.type === "bot-device") return null;
  return {
    type: getConnectionType(env.type),
    platform: env.name,
    version: env.version || "",
    os: env.os || "",
  };
}

export function getSessionMetadata(): SessionTypes.Metadata | null {
  return WindowMetadata.getWindowMetadata();
}

export function getAppMetadataFromDid(did: string): SessionTypes.Metadata | null {
  return {} as SessionTypes.Metadata;
}

export function getAppMetadata(app?: string | SessionTypes.Metadata): SessionTypes.Metadata {
  return (
    (typeof app === "undefined"
      ? getSessionMetadata()
      : typeof app === "string"
      ? getAppMetadataFromDid(app)
      : app) || ({} as SessionTypes.Metadata)
  );
}
