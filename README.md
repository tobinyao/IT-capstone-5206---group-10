# Fire Vulnerability Assessment Tool
### CITS5206 Capstone Project — Group 10

A web-based tool to assess the fire vulnerability of cultural heritage sites in the Franklin (FRK) and Albany (ALB) Districts of Western Australia.

---

## Project Overview

Western Australia's cultural heritage sites — including Aboriginal rock art, ochre mines, scarred trees, and historic buildings — face increasing risk from bushfires. This tool integrates heritage site data with environmental variables to classify each site's fire vulnerability as **Low**, **Medium**, or **High**, visualised through an interactive map interface.

**Client:** Associate Professor Sven Ouzman & Sean Winter  
**Facilitator:** Ella Zhang  
**Team:** Group 10

---

## Features (MVP)

- 🗺️ **Interactive Map** — Visualise heritage sites and their vulnerability levels across the study area
- 📊 **Vulnerability Classification** — Three-tier risk model (Low / Medium / High) based on topography, vegetation, and wind conditions
- 🏛️ **Heritage Data Integration** — Imports site data from ACHIS and Inherit registers
- 📁 **Data Export** — Export assessment results to Excel format
- ⚙️ **Configurable Sensitivity Parameters** — Adjustable settings for different heritage types (rock art, timber structures, ochre sites, etc.)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML / CSS / JavaScript, Leaflet.js |
| Backend | Python, Flask |
| Data Processing | Pandas, GeoPandas |
| Version Control | Git / GitHub (GitFlow) |
| Project Management | GitHub Issues & Milestones, Kanban |

---

## Team Members

| Student Name | Student Number |
|---|---|
| Tobin Yao | 24134929 |
| Shuo Ma | 23914891 |
| Yonghe Hu | 24108102 |
| Kunyang Xie | 24447687 |
| Zeyu Wang | 23320288 |
| Jue Hou | 24565925 |

---

## Project Structure

```
IT-capstone-5206-group-10/
├── docs/
│   ├── meeting-notes/        # All meeting records
│   ├── project-plan.md       # Timeline and milestones
│   └── D1-report.docx        # D1 submission
├── src/
│   ├── frontend/             # Map interface and UI
│   ├── backend/              # Flask API and scoring logic
│   └── data/                 # Data processing scripts
├── tests/                    # Test plans and scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/tobinyao/IT-capstone-5206---group-10.git
cd IT-capstone-5206---group-10

# Install dependencies
pip install -r requirements.txt

# Run the application
python src/backend/app.py
```

Then open your browser and go to `http://localhost:5000`

---

## License

This project is developed for academic purposes as part of CITS5206 at the University of Western Australia.
