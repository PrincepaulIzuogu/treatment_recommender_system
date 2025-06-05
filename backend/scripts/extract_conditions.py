#!/usr/bin/env python3
"""
extract_condition_names.py

Reads:
  - data/Ingested_data/condition_index.csv   (just a list of all condition_concept_id used)
  - data/concepts/CONCEPT.csv                (the huge vocabulary file)

Writes:
  - data/Ingested_data/condition_concept.csv (only those concept_ids + their names)
"""

import os
import pandas as pd
from csv import Sniffer

# --- CONFIGURE YOUR PATHS HERE ---
PROJECT_ROOT    = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
INDEX_PATH      = os.path.join(PROJECT_ROOT, "data", "Ingested_data", "condition_index.csv")
VOCAB_PATH      = os.path.join(PROJECT_ROOT, "data", "concepts",       "CONCEPT.csv")
OUTPUT_PATH     = os.path.join(PROJECT_ROOT, "data", "Ingested_data", "condition_concept.csv")
CHUNKSIZE       = 500_000

def sniff_delimiter(path, nbytes=5000):
    with open(path, encoding="utf-8", errors="ignore") as f:
        sample = f.read(nbytes)
    return Sniffer().sniff(sample).delimiter

def load_index_ids(path):
    df = pd.read_csv(path, dtype={"condition_concept_id": str})
    return set(df["condition_concept_id"].tolist())

def extract_names(vocab_path, delim, target_ids, out_path):
    first = True
    total = 0
    for chunk in pd.read_csv(vocab_path,
                             sep=delim,
                             usecols=["concept_id","concept_name","domain_id","vocabulary_id"],
                             dtype=str,
                             chunksize=CHUNKSIZE,
                             low_memory=False):
        # keep only those IDs present in our index
        keep = chunk[chunk["concept_id"].isin(target_ids)]
        if not keep.empty:
            cols = ["concept_id","concept_name","domain_id","vocabulary_id"]
            keep.to_csv(out_path,
                        mode="w" if first else "a",
                        header=first,
                        index=False,
                        columns=cols)
            total += len(keep)
            print(f"  → wrote {len(keep):,} rows")
            first = False
    return total

if __name__ == "__main__":
    print(f"Loading target condition IDs from {INDEX_PATH}...")
    target_ids = load_index_ids(INDEX_PATH)
    print(f"Found {len(target_ids):,} unique condition IDs.\n")

    print(f"Sniffing delimiter of {VOCAB_PATH}...")
    delim = sniff_delimiter(VOCAB_PATH)
    print(f"  Detected delimiter = {repr(delim)}\n")

    print("Extracting matching concept rows...")
    n = extract_names(VOCAB_PATH, delim, target_ids, OUTPUT_PATH)
    print(f"\nDone — extracted {n:,} condition concepts to {OUTPUT_PATH}")
