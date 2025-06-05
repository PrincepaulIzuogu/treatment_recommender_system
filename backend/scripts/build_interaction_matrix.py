# build_interaction_matrix.py
# Script to load OMOP CDM tables, filter patients, and build patient×drug and patient×condition interaction matrices
# by counting exposures/occurrences (similar to count vectorizer concept, but using explicit counts from structured data since the data used are already encoded in numeric figures)

import os
import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix

# Configuration
OMOP_DIR     = r"C:\Users\princepaul\Desktop\treatment_recommender_system\backend\data\1_omop_data_csv"
OUTPUT_DIR   = r"C:\Users\princepaul\Desktop\treatment_recommender_system\backend\data\Ingested_data"
MIN_EXPOSURES  = 5   # minimum drug exposures per patient
MIN_CONDITIONS = 1   # minimum condition occurrences per patient

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_csv(name):
    path = os.path.join(OMOP_DIR, name)
    print(f"Loading {name} from {path}...")
    return pd.read_csv(path, low_memory=False)

# Load the key tables
df_person    = load_csv('person.csv')
df_drug      = load_csv('drug_exposure.csv')
df_condition = load_csv('condition_occurrence.csv')

# Filter patients by minimum drug exposures
print(f"Filtering patients with < {MIN_EXPOSURES} drug exposures…")
exp_counts   = df_drug['person_id'].value_counts()
valid_pids   = exp_counts[exp_counts >= MIN_EXPOSURES].index
df_drug      = df_drug[df_drug['person_id'].isin(valid_pids)]

# Identify patients with any conditions (for cold-start coverage)
cond_counts     = df_condition['person_id'].value_counts()
valid_cond_pids = cond_counts[cond_counts >= MIN_CONDITIONS].index

# Union of both sets to cover everyone who has either drugs or conditions
all_pids = np.union1d(df_drug['person_id'].unique(), df_condition['person_id'].unique())

# Build patient×drug interaction matrix
print("Building patient×drug interaction matrix by counting exposures…")
unique_pids   = np.sort(all_pids)
unique_drugs  = np.sort(df_drug['drug_concept_id'].unique())
pid_to_idx    = {pid: i for i, pid in enumerate(unique_pids)}
drug_to_idx   = {did: i for i, did in enumerate(unique_drugs)}

rows_d = df_drug['person_id'].map(pid_to_idx)
cols_d = df_drug['drug_concept_id'].map(drug_to_idx)
data_d = np.ones(len(df_drug), dtype=np.int8)

mat_drug = csr_matrix(
    (data_d, (rows_d, cols_d)),
    shape=(len(unique_pids), len(unique_drugs))
)

# Build patient×condition interaction matrix
print("Building patient×condition interaction matrix by counting occurrences…")
unique_conds  = np.sort(df_condition['condition_concept_id'].unique())
cond_to_idx   = {cid: i for i, cid in enumerate(unique_conds)}

rows_c = df_condition['person_id'].map(pid_to_idx)
cols_c = df_condition['condition_concept_id'].map(cond_to_idx)
data_c = np.ones(len(df_condition), dtype=np.int8)

mat_cond = csr_matrix(
    (data_c, (rows_c, cols_c)),
    shape=(len(unique_pids), len(unique_conds))
)

# Save all outputs
print(f"Saving outputs to {OUTPUT_DIR}…")
np.savez_compressed(
    os.path.join(OUTPUT_DIR, 'interaction_matrix_drug.npz'),
    data=mat_drug.data,
    indices=mat_drug.indices,
    indptr=mat_drug.indptr,
    shape=mat_drug.shape
)
np.savez_compressed(
    os.path.join(OUTPUT_DIR, 'interaction_matrix_condition.npz'),
    data=mat_cond.data,
    indices=mat_cond.indices,
    indptr=mat_cond.indptr,
    shape=mat_cond.shape
)
pd.DataFrame({'person_id': unique_pids}).to_csv(os.path.join(OUTPUT_DIR, 'person_index.csv'), index=False)
pd.DataFrame({'drug_concept_id': unique_drugs}).to_csv(os.path.join(OUTPUT_DIR, 'drug_index.csv'), index=False)
pd.DataFrame({'condition_concept_id': unique_conds}).to_csv(os.path.join(OUTPUT_DIR, 'condition_index.csv'), index=False)

print("Completed. Check the output directory for:")
print("  • interaction_matrix_drug.npz")
print("  • interaction_matrix_condition.npz")
print("  • person_index.csv")
print("  • drug_index.csv")
print("  • condition_index.csv")
