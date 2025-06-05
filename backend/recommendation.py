from sqlalchemy.orm import Session
from model.model import Drug, PatientDrugInteraction, PatientConditionInteraction, Condition
from sqlalchemy import func
import numpy as np
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import TruncatedSVD
from sklearn.cluster import KMeans
from scipy.stats import pearsonr
from model.model import Patient  

# ---------------------------- COLLABORATIVE FILTERING + CLUSTERING ----------------------------
# Enhanced recommendation: Clustering + User-based Collaborative Filtering with Hybrid Similarity

def get_related_drugs(session: Session, target_drug_id: int, top_n: int = 2):
    # 🔍 STEP 1: Build interaction matrix (patients x drugs)
    interactions = session.query(PatientDrugInteraction).all()
    user_drug_matrix = defaultdict(dict)
    for interaction in interactions:
        user_drug_matrix[interaction.person_id][interaction.drug_concept_id] = interaction.exposure_count

    # 🔍 STEP 2: Create a drug-user matrix
    drugs = list({d.drug_concept_id for d in session.query(Drug).all()})
    patients = list(user_drug_matrix.keys())
    drug_index = {drug_id: idx for idx, drug_id in enumerate(drugs)}
    patient_index = {pid: idx for idx, pid in enumerate(patients)}

    matrix = np.zeros((len(drugs), len(patients)))
    for pid, interactions in user_drug_matrix.items():
        for drug_id, exposure in interactions.items():
            if drug_id in drug_index:
                matrix[drug_index[drug_id], patient_index[pid]] = exposure

    # 🔍 STEP 3: Standardize data (for Pearson-like normalization)
    scaler = StandardScaler(with_mean=True, with_std=False)
    matrix_std = scaler.fit_transform(matrix)

    # 🔍 STEP 4: Hybrid Similarity - Cosine + Pearson
    cosine_sim = cosine_similarity(matrix_std)
    pearson_sim = np.corrcoef(matrix_std)
    target_idx = drug_index.get(target_drug_id)
    if target_idx is None:
        return []

    # Combine cosine and pearson (weighted)
    hybrid_sim = 0.7 * cosine_sim[target_idx] + 0.3 * pearson_sim[target_idx]
    similar_indices = np.argsort(hybrid_sim)[::-1][1:top_n+1]

    # 🔍 STEP 5: Clustering (KMeans to group similar drugs)
    n_clusters = min(5, len(drugs))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42).fit(matrix_std)
    target_cluster = kmeans.labels_[target_idx]
    clustered_indices = [i for i, label in enumerate(kmeans.labels_) if label == target_cluster and i != target_idx]

    # Combine similarity and cluster filtering
    combined_indices = [idx for idx in similar_indices if idx in clustered_indices]
    if len(combined_indices) < top_n:
        combined_indices.extend([idx for idx in clustered_indices if idx not in combined_indices])

    final_indices = combined_indices[:top_n]

    # 🔍 STEP 6: Retrieve Drug Info with Safe GROUP BY for Conditions
    similar_drugs = []
    for idx in final_indices:
        similar_drug_id = drugs[idx]
        drug = session.query(Drug).filter(Drug.drug_concept_id == similar_drug_id).first()
        if drug:
            try:
                condition_result = (
                    session.query(
                        Condition.condition_concept_id,
                        Condition.concept_name,
                        func.count().label('count')
                    )
                    .join(PatientConditionInteraction, Condition.condition_concept_id == PatientConditionInteraction.condition_concept_id)
                    .join(PatientDrugInteraction, PatientConditionInteraction.person_id == PatientDrugInteraction.person_id)
                    .filter(
                        PatientDrugInteraction.drug_concept_id == drug.drug_concept_id,
                        Condition.concept_name.isnot(None)
                    )
                    .group_by(Condition.condition_concept_id, Condition.concept_name)
                    .order_by(func.count().desc())
                    .limit(1)
                    .first()
                )
                condition_name = condition_result.concept_name if condition_result else "Unknown Condition"
            except Exception as e:
                print(f"Error fetching condition for drug {drug.drug_concept_id}: {e}")
                condition_name = "Unknown Condition"

            similar_drugs.append({
                "drug_concept_id": drug.drug_concept_id,
                "concept_name": drug.concept_name,
                "condition_name": condition_name
            })

    return similar_drugs


# ---------------------------- PATIENT-SPECIFIC RECOMMENDATION ----------------------------
# Core Idea: Frequency-based user collaborative filtering
# Method: Exposure Pattern Mining across similar patient cohorts (based on shared condition codes)
#     - User-Based Collaborative Filtering (Condition → Similar Users)
def get_patient_recommendations(session: Session, patient_id: int, top_n: int = 5):
    # 👤 STEP 1: Retrieve patient's clinical profile
    patient = session.query(Patient).filter(Patient.id == patient_id).first()
    print(f"👤 Patient ID: {patient_id}")

    if not patient or not patient.condition:
        print("❌ Patient not found or condition is missing.")
        return []

    condition_name = patient.condition.strip()
    print(f"🔍 Matching condition name: '{condition_name}'")

    # 🔍 STEP 2: Map condition string to concept_id(s) — works like CountVectorizer → token mapping
    # Ensures only conditions with known usage (interactions) are selected
    valid_condition_ids = (
        session.query(Condition.condition_concept_id)
        .join(PatientConditionInteraction, Condition.condition_concept_id == PatientConditionInteraction.condition_concept_id)
        .filter(Condition.concept_name.ilike(f"%{condition_name}%"))
        .distinct()
        .all()
    )
    valid_condition_ids = [row.condition_concept_id for row in valid_condition_ids]

    if not valid_condition_ids:
        print("❌ No valid condition IDs found in both Condition and PatientConditionInteraction.")
        return []

    print(f"✅ Found {len(valid_condition_ids)} valid condition concept ID(s): {valid_condition_ids}")

    # 👥 STEP 3: Identify similar patients using user-based collaborative filtering (shared condition match)
    # Equivalent to: Finding nearest neighbors based on profile similarity (condition)
    person_ids = (
        session.query(PatientConditionInteraction.person_id)
        .filter(PatientConditionInteraction.condition_concept_id.in_(valid_condition_ids))
        .distinct()
        .all()
    )
    person_ids = [row.person_id for row in person_ids]

    print(f"👥 Found {len(person_ids)} people with this condition")

    if not person_ids:
        print("❌ No people found with these condition codes.")
        return []

    # 💊 STEP 4: Mine top drugs prescribed to these neighbors (Exposure Pattern Mining)
    # Conceptually similar to: Aggregated CountVectorizer + Ranking by score
    drug_counts = (
        session.query(
            Drug.drug_concept_id,
            Drug.concept_name,
            func.sum(PatientDrugInteraction.exposure_count).label("total_exposures")
        )
        .join(PatientDrugInteraction, Drug.drug_concept_id == PatientDrugInteraction.drug_concept_id)
        .filter(PatientDrugInteraction.person_id.in_(person_ids))
        .group_by(Drug.drug_concept_id, Drug.concept_name)
        .order_by(func.sum(PatientDrugInteraction.exposure_count).desc())
        .limit(top_n)
        .all()
    )

    print(f"💊 Found {len(drug_counts)} recommended drugs")

    # 📦 STEP 5: Return top-N drugs, with frequency exposure score (like TF values)
    # Each drug is a candidate based on collaborative cohort usage
    recommendations = []
    for drug_id, concept_name, total_exposures in drug_counts:
        print(f"➡️ Drug: {concept_name} | ID: {drug_id} | Exposure Count: {total_exposures}")
        recommendations.append({
            "drug_concept_id": drug_id,
            "concept_name": concept_name,
            "condition_name": condition_name,
            "exposure_count": int(total_exposures)
        })

    return recommendations



# ---------------------------- CO-USAGE FROM RECOMMENDED DRUG ----------------------------
# Co-usage filtering based on the top recommended drug (not self-history)
# Used to suggest additional drugs that are often co-taken with the most-used recommended drug


def get_co_usage_drugs(session: Session, patient_id: int, top_n: int = 2):
    # 🔍 STEP 1: Get patient-specific recommended drugs
    recs = get_patient_recommendations(session, patient_id, top_n=5)
    if not recs:
        print("❌ No recommendations available for this patient.")
        return []

    # 🎯 Use the highest-exposed recommended drug as reference
    top_drug = max(recs, key=lambda x: x["exposure_count"])
    target_drug_id = top_drug["drug_concept_id"]
    target_drug_name = top_drug["concept_name"]
    condition_name = top_drug["condition_name"]
    print(f"\n🎯 Top recommended drug: {target_drug_name} | ID: {target_drug_id} | Exposure: {top_drug['exposure_count']}")

    # 👥 STEP 2: Find all patients who took this drug
    co_users = (
        session.query(PatientDrugInteraction.person_id)
        .filter(PatientDrugInteraction.drug_concept_id == target_drug_id)
        .distinct()
        .all()
    )
    co_user_ids = [row.person_id for row in co_users]
    print(f"👥 Co-users who also used this drug: {len(co_user_ids)}")

    if not co_user_ids:
        print("❌ No co-users found.")
        return [top_drug]  # Still return the anchor drug

    # 💊 STEP 3: Find top co-used drugs (excluding anchor)
    co_usage_counts = (
        session.query(
            Drug.drug_concept_id,
            Drug.concept_name,
            func.sum(PatientDrugInteraction.exposure_count).label("total_exposures")
        )
        .join(PatientDrugInteraction, Drug.drug_concept_id == PatientDrugInteraction.drug_concept_id)
        .filter(
            PatientDrugInteraction.person_id.in_(co_user_ids),
            PatientDrugInteraction.drug_concept_id != target_drug_id
        )
        .group_by(Drug.drug_concept_id, Drug.concept_name)
        .order_by(func.sum(PatientDrugInteraction.exposure_count).desc())
        .limit(top_n)
        .all()
    )

    print(f"\n🔁 Co-usage recommendations based on '{target_drug_name}': {len(co_usage_counts)} found")

    # 📦 STEP 4: Format co-used drugs + main anchor drug
    recommendations = [top_drug]  # Start with anchor drug

    for drug_id, concept_name, total_exposures in co_usage_counts:
        try:
            condition_result = (
                session.query(
                    Condition.concept_name,
                    func.count().label("count")
                )
                .join(PatientConditionInteraction, Condition.condition_concept_id == PatientConditionInteraction.condition_concept_id)
                .join(PatientDrugInteraction, PatientConditionInteraction.person_id == PatientDrugInteraction.person_id)
                .filter(
                    PatientDrugInteraction.drug_concept_id == drug_id,
                    PatientDrugInteraction.person_id.in_(co_user_ids),
                    Condition.concept_name.isnot(None)
                )
                .group_by(Condition.concept_name)
                .order_by(func.count().desc())
                .limit(1)
                .first()
            )
            co_condition = condition_result.concept_name if condition_result else "Unknown Condition"
        except Exception as e:
            print(f"⚠️ Condition fetch error for drug {drug_id}: {e}")
            co_condition = "Unknown Condition"

        print(f"➡️ Drug: {concept_name} | ID: {drug_id} | Exposure Count: {total_exposures} | Condition: {co_condition}")
        recommendations.append({
            "drug_concept_id": drug_id,
            "concept_name": concept_name,
            "condition_name": co_condition,
            "exposure_count": int(total_exposures)
        })

    return recommendations
