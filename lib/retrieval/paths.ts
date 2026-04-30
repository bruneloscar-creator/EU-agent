import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const RAW_DIR = path.join(DATA_DIR, "raw");
export const CLEANED_DIR = path.join(DATA_DIR, "cleaned");
export const MODEL_CACHE_DIR = path.join(DATA_DIR, "models");
export const DB_PATH = path.join(DATA_DIR, "lex-eu.db");
export const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
