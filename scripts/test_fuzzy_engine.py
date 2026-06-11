import sys, os
# Add eh-api to path
sys.path.append(os.path.join(os.getcwd(), 'eh-api'))

from clinical_engines import fuzzy_engine, detect_diseases_and_meds
from sqlalchemy.orm import sessionmaker
from models import engine as db_engine

SessionLocal = sessionmaker(bind=db_engine)
db = SessionLocal()

def test_fuzzy():
    print("Testing Fuzzy Engine...")
    query = "pait me darrd aur constipation"
    print(f"Query: {query}")
    
    # Test the full detection function
    print(f"\nRunning detect_diseases_and_meds for '{query}':")
    result = detect_diseases_and_meds(db, query)
    print(f"Detected Systems: {result['systems']}")
    print(f"Suggested Meds: {result['meds']}")

if __name__ == "__main__":
    test_fuzzy()
