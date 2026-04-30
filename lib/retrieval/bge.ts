import fs from "node:fs";

import { MODEL_CACHE_DIR } from "./paths";

export const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBEDDING_DIMENSIONS = 384;
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

type FeatureExtractor = (
  input: string | string[],
  options: { pooling: "mean"; normalize: boolean }
) => Promise<{ data: Float32Array | number[]; dims: number[] }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    fs.mkdirSync(MODEL_CACHE_DIR, { recursive: true });
    extractorPromise = (async () => {
      const dynamicImport = new Function(
        "specifier",
        "return import(specifier)"
      ) as (specifier: string) => Promise<typeof import("@xenova/transformers")>;
      const { env, pipeline } = await dynamicImport("@xenova/transformers");
        env.cacheDir = MODEL_CACHE_DIR;
        env.allowLocalModels = true;
        env.allowRemoteModels = true;
      return pipeline("feature-extraction", EMBEDDING_MODEL) as Promise<FeatureExtractor>;
    })();
  }

  return extractorPromise;
}

function toVectors(output: { data: Float32Array | number[]; dims: number[] }) {
  const dimensions = output.dims.at(-1) ?? EMBEDDING_DIMENSIONS;
  const rows = output.dims.length > 1 ? output.dims[0] : 1;
  const data = output.data;
  const vectors: Float32Array[] = [];

  for (let row = 0; row < rows; row += 1) {
    const start = row * dimensions;
    const values = Array.from(data).slice(start, start + dimensions);
    vectors.push(new Float32Array(values));
  }

  return vectors;
}

export async function embedPassages(texts: string[]) {
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return toVectors(output);
}

export async function embedQuery(query: string) {
  const extractor = await getExtractor();
  const output = await extractor(`${QUERY_PREFIX}${query}`, {
    pooling: "mean",
    normalize: true
  });
  return toVectors(output)[0];
}
