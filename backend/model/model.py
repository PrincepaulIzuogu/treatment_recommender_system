from sqlalchemy import Column, Integer, BigInteger, String, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base
from pydantic import BaseModel

DATABASE_URL = 'postgresql://postgres:THD111@localhost:5432/recommendation'
engine = create_engine(DATABASE_URL)
Base = declarative_base()

# 🔥 Corrected Patient table with id as primary key
class Patient(Base):
    __tablename__ = 'patient'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    condition = Column(String, nullable=False)


class Drug(Base):
    __tablename__ = 'drug'
    drug_concept_id = Column(BigInteger, primary_key=True, index=True)
    col_index = Column(Integer, nullable=False)
    concept_name = Column(String, nullable=False, index=True)

class Condition(Base):
    __tablename__ = 'condition'
    condition_concept_id = Column(BigInteger, primary_key=True, index=True)
    concept_name = Column(String, nullable=False, index=True)

# 🔥 Corrected ForeignKey references to use Patient.id
class PatientDrugInteraction(Base):
    __tablename__ = 'patient_drug_interaction'
    person_id = Column(Integer, ForeignKey('patient.id'), primary_key=True, index=True)
    drug_concept_id = Column(BigInteger, ForeignKey('drug.drug_concept_id'), primary_key=True, index=True)
    exposure_count = Column(Integer, nullable=False)

class PatientConditionInteraction(Base):
    __tablename__ = 'patient_condition_interaction'
    person_id = Column(Integer, ForeignKey('patient.id'), primary_key=True, index=True)
    condition_concept_id = Column(BigInteger, ForeignKey('condition.condition_concept_id'), primary_key=True, index=True)
    occurrence_count = Column(Integer, nullable=False)

class DoctorDrugClick(Base):
    __tablename__ = 'doctor_drug_click'
    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer, nullable=False, index=True)
    drug_concept_id = Column(BigInteger, nullable=False, index=True)

class Concept(Base):
    __tablename__ = 'concept'
    concept_id = Column(BigInteger, primary_key=True, index=True)
    concept_name = Column(String, nullable=False, index=True)
    domain_id = Column(String, nullable=False, index=True)

# 🔥 Pydantic models
class DrugCard(BaseModel):
    drug_concept_id: int
    concept_name: str
    condition_concept_id: int
    condition_name: str
    exposure_count: int

class Recommendation(BaseModel):
    drug_concept_id: int
    concept_name: str
    predicted_score: float
    population_support: float

# 🔥 Pydantic Patient Models with from_attributes (or orm_mode)
class PatientInput(BaseModel):
    name: str
    age: int
    gender: str
    condition: str

class PatientOutput(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    condition: str

    class Config:
        from_attributes = True  # Or: orm_mode = True (for Pydantic < v2)


# 🔥 Create tables if they don't exist
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")