import streamlit as st
import pandas as pd
import sys, os, re

# Always load engines from eh-api folder (works from project root or eh-api/)
EH_API_DIR = os.path.dirname(os.path.abspath(__file__))
if EH_API_DIR not in sys.path:
    sys.path.insert(0, EH_API_DIR)
os.chdir(EH_API_DIR)

from clinical_engines import fuzzy_engine, detect_diseases_and_meds
from models import engine as db_engine, SessionLocal

# 1. Page Setup
st.set_page_config(
    page_title="EH Arogya Sutra - Atomic Search",
    page_icon="🌿",
    layout="wide"
)

# 2. Custom CSS for professional look
st.markdown("""
    <style>
    .main {
        background-color: #f5f7f9;
    }
    .stMetric {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .remedy-card {
        background-color: #e8f5e9;
        padding: 10px;
        border-left: 5px solid #2e7d32;
        margin: 5px 0;
    }
    </style>
    """, unsafe_allow_html=True)

# 3. Header
st.title("🌿 EH Arogya Sutra — Atomic Search Engine")
st.markdown("#### Instant Clinical Mapping from 14,000+ Disease Records")

# 4. Search Interface
col_search, col_stats = st.columns([3, 1])

with col_search:
    user_input = st.text_input(
        "Describe Symptoms (Hindi or English):",
        placeholder="e.g., pait me darrd aur constipation, breast lump, urine burning",
        help="You can enter multiple symptoms separated by 'and', 'aur', or commas."
    )

with col_stats:
    if fuzzy_engine.search_space:
        st.metric("Database Records", f"{len(fuzzy_engine.search_space):,}")
    else:
        st.error("Database not loaded!")

# 5. Results Logic
if user_input:
    with st.spinner('Analyzing symptoms and searching database...'):
        # Split symptoms for atomic search
        raw_parts = re.split(r' and | aur | , | ,| with | along with ', user_input.lower())
        atomic_parts = [p.strip() for p in raw_parts if len(p.strip()) > 2]
        
        if not atomic_parts:
            st.warning("Please enter a longer symptom description.")
        else:
            st.write(f"Detected **{len(atomic_parts)}** atomic symptoms. Searching...")
            
            for part in atomic_parts:
                st.subheader(f"📍 Symptom: {part.upper()}")
                
                # Perform fuzzy search
                matches = fuzzy_engine.find_matches(part, threshold=70)
                
                if matches:
                    # Display top 3 matches in columns
                    cols = st.columns(len(matches[:3]))
                    for i, m in enumerate(matches[:3]):
                        with cols[i]:
                            st.info(f"**{m['name']}**")
                            st.write(f"**System:** {m['system']}")
                            st.success(f"**Remedies:** {m['meds']}")
                            st.progress(m['score']/100, text=f"Match Score: {int(m['score'])}%")
                else:
                    st.error(f"No direct match found for '{part}'. Try simpler terms.")
                
                st.divider()

# 6. Sidebar
st.sidebar.image("https://img.icons8.com/color/96/000000/herbal-medicine.png", width=100)
st.sidebar.header("Clinical Protocol")
st.sidebar.info("""
**9 Rule Engine Status:**
- Rule 1: Temperament [Active]
- Rule 3: Organ Affinity [Active]
- Rule 8: Uniqueness [Active]
- Rule 9: DB Integration [Active]
""")

st.sidebar.warning("""
**Patient Guidelines:**
1. Use warm water only.
2. Avoid lemon, onion, garlic.
3. Maintain 15 min gap with food.
""")

if st.sidebar.button("Clear Search"):
    st.rerun()
