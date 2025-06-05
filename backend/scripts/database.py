#!/usr/bin/env python3
# database.py

import os
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sqlalchemy import create_engine, Column, Integer, String, MetaData, Table
from sqlalchemy.dialects.postgresql import BIGINT, TEXT

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:THD111@localhost:5432/recommendation')
OMOP_DIR = os.getenv('OMOP_DIR', r'C:\Users\princepaul\Desktop\treatment_recommender_system\backend\data\1_omop_data_csv')
CONCEPTS_CSV = os.getenv('CONCEPT_CSV', r'C:\Users\princepaul\Desktop\treatment_recommender_system\backend\data\concepts\CONCEPT.csv')
OUTPUT_DIR = os.getenv('OUTPUT_DIR', r'C:\Users\princepaul\Desktop\treatment_recommender_system\backend\data\Ingested_data')

engine = create_engine(DB_URL)
metadata = MetaData()

# Table definitions
person_table = Table('person', metadata,
    Column('person_id', BIGINT, primary_key=True),
    Column('gender_concept_id', BIGINT, nullable=False),
    Column('year_of_birth', Integer, nullable=False),
    Column('row_index', Integer, nullable=False),
)

drug_table = Table('drug', metadata,
    Column('drug_concept_id', BIGINT, primary_key=True),
    Column('col_index', Integer, nullable=False),
    Column('concept_name', TEXT, nullable=False),
)

concept_table = Table('concept', metadata,
    Column('concept_id', BIGINT, primary_key=True),
    Column('concept_name', TEXT, nullable=False),
    Column('domain_id', String),
    Column('vocabulary_id', String),
)

condition_table = Table('condition', metadata,
    Column('condition_concept_id', BIGINT, primary_key=True),
    Column('concept_name', TEXT, nullable=False),
)

patient_drug_interaction = Table('patient_drug_interaction', metadata,
    Column('person_id', BIGINT, nullable=False),
    Column('drug_concept_id', BIGINT, nullable=False),
    Column('exposure_count', Integer, nullable=False),
)

patient_condition_interaction = Table('patient_condition_interaction', metadata,
    Column('person_id', BIGINT, nullable=False),
    Column('condition_concept_id', BIGINT, nullable=False),
    Column('occurrence_count', Integer, nullable=False),
)

# Functions
def create_tables():
    print("Dropping existing tables...")
    metadata.drop_all(engine)
    print("Creating new tables...")
    metadata.create_all(engine)
    print("✅ Tables created.")

def load_indices():
    print("Loading person demographics & indices…")
    df_raw = pd.read_csv(os.path.join(OMOP_DIR, 'person.csv'), usecols=['person_id','gender_concept_id','year_of_birth'], low_memory=False)
    df_idx = pd.read_csv(os.path.join(OUTPUT_DIR, 'person_index.csv'))
    df_idx['row_index'] = df_idx.index
    df_person = df_idx.merge(df_raw, on='person_id', how='left')
    df_person.to_sql('person', engine, if_exists='replace', index=False)

    print("Loading drug indices with concept names…")
    df_drug = pd.read_csv(os.path.join(OUTPUT_DIR, 'drug_index.csv'), dtype={'drug_concept_id': int})
    df_concept = pd.read_csv(CONCEPTS_CSV, sep='\t', usecols=['concept_id','concept_name','domain_id'], dtype={'concept_id': int, 'concept_name': str, 'domain_id': str})
    df_drug = df_drug.merge(df_concept[df_concept['domain_id']=='Drug'], left_on='drug_concept_id', right_on='concept_id', how='left')
    df_drug['col_index'] = df_drug.index
    df_drug.to_sql('drug', engine, if_exists='replace', index=False)
    print("✅ person & drug tables loaded.")

def load_concepts():
    print(f"Loading concept vocabulary from {CONCEPTS_CSV}")
    df_vocab = pd.read_csv(CONCEPTS_CSV, sep='\t', usecols=['concept_id','concept_name','domain_id','vocabulary_id'], dtype={'concept_id': int, 'concept_name': str, 'domain_id': str, 'vocabulary_id': str}, low_memory=False)
    df_vocab.to_sql('concept', engine, if_exists='replace', index=False)
    print(f"✅ Loaded {len(df_vocab):,} concepts.")

def load_conditions():
    print("Loading conditions from concept vocabulary into 'condition' table...")
    df_vocab = pd.read_csv(CONCEPTS_CSV, sep='\t', usecols=['concept_id','concept_name','domain_id'], dtype={'concept_id': int, 'concept_name': str, 'domain_id': str})
    df_conditions = df_vocab[df_vocab['domain_id'] == 'Condition'].copy()
    df_conditions = df_conditions.rename(columns={'concept_id': 'condition_concept_id'})
    df_conditions.to_sql('condition', engine, if_exists='replace', index=False)
    print(f"✅ Loaded {len(df_conditions):,} conditions into 'condition' table.")

def load_interactions():
    print("Loading drug interaction matrix…")
    m = np.load(os.path.join(OUTPUT_DIR, 'interaction_matrix_drug.npz'))
    mat = csr_matrix((m['data'], m['indices'], m['indptr']), shape=m['shape'])
    coo = mat.tocoo()
    df_pidx = pd.read_csv(os.path.join(OUTPUT_DIR, 'person_index.csv'))
    df_didx = pd.read_csv(os.path.join(OUTPUT_DIR, 'drug_index.csv'), dtype={'drug_concept_id': int})
    df_d = pd.DataFrame({
        'person_id': df_pidx.loc[coo.row, 'person_id'].values,
        'drug_concept_id': df_didx.loc[coo.col, 'drug_concept_id'].values,
        'exposure_count': coo.data.astype(int)
    })
    df_d.to_sql('patient_drug_interaction', engine, if_exists='replace', index=False, chunksize=100000)
    print(f"  → loaded {len(df_d):,} drug records.")

    print("Loading condition interaction matrix…")
    m2 = np.load(os.path.join(OUTPUT_DIR, 'interaction_matrix_condition.npz'))
    mat2 = csr_matrix((m2['data'], m2['indices'], m2['indptr']), shape=m2['shape'])
    coo2 = mat2.tocoo()
    df_cidx = pd.read_csv(os.path.join(OUTPUT_DIR, 'condition_index.csv'), dtype={'condition_concept_id': int})
    df_c = pd.DataFrame({
        'person_id': df_pidx.loc[coo2.row, 'person_id'].values,
        'condition_concept_id': df_cidx.loc[coo2.col, 'condition_concept_id'].values,
        'occurrence_count': coo2.data.astype(int)
    })
    df_c.to_sql('patient_condition_interaction', engine, if_exists='replace', index=False, chunksize=100000)
    print(f"  → loaded {len(df_c):,} condition records.")

# Main execution
if __name__ == '__main__':
    create_tables()
    load_concepts()
    load_conditions()  # 🔥 Ensure condition table is properly populated
    load_indices()
    load_interactions()
    print("🎉 Data ingestion complete!")
