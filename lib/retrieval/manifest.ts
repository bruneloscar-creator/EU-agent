import fs from "node:fs";

import { MANIFEST_PATH } from "./paths";
import type { Manifest } from "./types";

export function readManifest(): Manifest | null {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  } catch {
    return null;
  }
}
