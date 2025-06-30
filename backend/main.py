from fastapi import FastAPI, Query, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, aliased
from model.model import Base, Drug, Condition, PatientDrugInteraction, PatientConditionInteraction, DoctorDrugClick, DrugCard, Recommendation, Patient, PatientInput, PatientOutput
import uuid
from recommendation import get_related_drugs, get_patient_recommendations, get_co_usage_drugs

app = FastAPI(title="Treatment Recommender System")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = 'postgresql://postgres:THD111@localhost:5432/recommendation'
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

session_map = {}

@app.get("/session/new")
def create_session():
    session_id = str(uuid.uuid4())
    session_map[session_id] = {"selected_drugs": []}
    return {"session_id": session_id}

@app.get("/drugs/list", response_model=List[DrugCard])
def get_drugs(
    session_id: str = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1),
    search: str = Query(None)
):
    session = SessionLocal()
    try:
        offset = (page - 1) * page_size  # 🔥 Offset calculation
        query = session.query(
            PatientDrugInteraction,
            Drug,
            Condition,
            PatientConditionInteraction
        ).join(
            Drug, Drug.drug_concept_id == PatientDrugInteraction.drug_concept_id
        ).join(
            PatientConditionInteraction, PatientConditionInteraction.person_id == PatientDrugInteraction.person_id
        ).join(
            Condition, Condition.condition_concept_id == PatientConditionInteraction.condition_concept_id
        ).filter(
            Drug.concept_name.isnot(None),
            Condition.concept_name.isnot(None)
        )

        if search:
            query = query.filter(Drug.concept_name.ilike(f"%{search}%"))

        # Proper offset and limit for consistent pagination
        results = query.offset(offset).limit(page_size).all()

        if not results:
            raise HTTPException(status_code=404, detail="No drugs found")

        return [
            DrugCard(
                drug_concept_id=drug.drug_concept_id,
                concept_name=drug.concept_name or "Unknown Drug",
                condition_concept_id=cond.condition_concept_id,
                condition_name=cond.concept_name or "Unknown Condition",
                exposure_count=d.exposure_count
            )
            for d, drug, cond, pc in results
        ]
    finally:
        session.close()

@app.post("/clicks/{session_id}/{drug_id}")
def log_click(session_id: str, drug_id: int):
    if session_id not in session_map:
        raise HTTPException(status_code=404, detail="Session not found")
    session_map[session_id]["selected_drugs"].append(drug_id)
    return {"message": f"Logged click for drug {drug_id} in session {session_id}"}



@app.get("/drug_details/{drug_id}")
def get_drug_details(drug_id: int):
    session = SessionLocal()
    try:
        # 🔥 Check if the drug exists
        drug = session.query(Drug).filter(Drug.drug_concept_id == drug_id).first()
        if not drug:
            raise HTTPException(status_code=404, detail="Drug not found")

        # 🔥 Fetch related drugs using the recommendation system (Collaborative Filtering)
        related_drugs = get_related_drugs(session, drug_id, top_n=2)

        return {
            "related_drugs": related_drugs
        }

    finally:
        session.close()


@app.post("/clicks/{session_id}/{drug_id}")
def log_click(session_id: str, drug_id: int):
    if session_id not in session_map:
        raise HTTPException(status_code=404, detail="Session not found")
    session_map[session_id]["selected_drugs"].append(drug_id)
    return {"message": f"Logged click for drug {drug_id} in session {session_id}"}


# 🔥 New: Get list of patients
@app.get("/patients/list", response_model=List[PatientOutput])
def get_patients():
    session = SessionLocal()
    try:
        patients = session.query(Patient).all()
        if not patients:
            # 🔥 Instead of HTTPException, return an empty list or a message
            return []
        return [PatientOutput.from_orm(p) for p in patients]
    finally:
        session.close()

@app.post("/patients/create")
def create_patient(patient: PatientInput):
    session = SessionLocal()
    try:
        new_patient = Patient(
            name=patient.name,
            age=patient.age,
            gender=patient.gender,
            condition=patient.condition
        )
        session.add(new_patient)
        session.commit()
        return {"message": "Patient created successfully"}
    finally:
        session.close()


@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int):
    session = SessionLocal()
    try:
        patient = session.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        session.delete(patient)
        session.commit()
        return {"message": "Patient deleted successfully"}
    finally:
        session.close()


@app.get("/conditions/list", response_model=List[str])
def get_all_conditions():
    session = SessionLocal()
    try:
        results = (
            session.query(Condition.concept_name)
            .filter(Condition.concept_name.isnot(None))
            .distinct()
            .order_by(Condition.concept_name)
            .all()
        )
        return [r.concept_name for r in results]
    finally:
        session.close()





# 🧠 Recommend drugs for a specific patient using hybrid similarity filtering
@app.get("/recommendations/{patient_id}")
def get_recommendations(patient_id: int):
    session = SessionLocal()
    try:
        results = get_patient_recommendations(session, patient_id)
        return results
    finally:
        session.close()

# 🧠 Recommend co-usage drugs based on the most-exposed drug of the patient
@app.get("/co-usage/{patient_id}")
def get_co_usage(patient_id: int):
    session = SessionLocal()
    try:
        return get_co_usage_drugs(session, patient_id)
    finally:
        session.close()
