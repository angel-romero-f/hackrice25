"""
Seed script to populate MongoDB with sample clinic data for demo purposes.
Run this after setting up your MongoDB Atlas connection.
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# Sample clinic data for Houston area (hackathon demo)
SAMPLE_CLINICS = [
    {
        "name": "Harris Health System - Acres Homes Health Center",
        "address": "8021 West Montgomery Road, Houston, TX 77088",
        "phone": "(713) 566-6400",
        "services": ["Primary Care", "Pediatrics", "Women's Health", "Dental", "Mental Health"],
        "pricing_info": "Sliding scale based on income. No insurance required. Typical visit: $20-$60.",
        "price": "40",
        "languages": ["English", "Spanish"],
        "hours": "Monday-Friday 7:00 AM - 7:00 PM, Saturday 8:00 AM - 4:00 PM",
        "walk_in_accepted": True,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.harrishealth.org",
        "notes": "Part of Harris Health System. Accepts patients regardless of ability to pay."
    },
    {
        "name": "Legacy Community Health - Northside",
        "address": "2002 Airline Drive, Houston, TX 77009",
        "phone": "(713) 678-4800",
        "services": ["Primary Care", "Urgent Care", "Dental", "Vision", "Pharmacy"],
        "pricing_info": "Sliding fee scale. Uninsured patients pay based on income. Emergency visits: $75-$150.",
        "price": "112",
        "languages": ["English", "Spanish", "Vietnamese"],
        "hours": "Monday-Friday 8:00 AM - 8:00 PM, Saturday 8:00 AM - 4:00 PM",
        "walk_in_accepted": True,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.legacycommunityhealth.org",
        "notes": "FQHC serving all patients regardless of insurance status or ability to pay."
    },
    {
        "name": "Houston Community Health Centers - Riverside",
        "address": "3611 Wheeler Street, Houston, TX 77004",
        "phone": "(713) 748-7900",
        "services": ["Primary Care", "Women's Health", "Pediatrics", "Chronic Disease Management"],
        "pricing_info": "Income-based sliding scale. Typical office visit: $25-$45 for uninsured.",
        "price": "35",
        "languages": ["English", "Spanish"],
        "hours": "Monday, Wednesday, Friday 8:00 AM - 5:00 PM",
        "walk_in_accepted": False,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.houstoncommunityhealth.org",
        "notes": "Appointments required. Financial assistance available."
    },
    {
        "name": "People's Community Clinic",
        "address": "3801 Bissonnet Street, Houston, TX 77005",
        "phone": "(713) 528-0169",
        "services": ["Primary Care", "Mental Health", "Case Management", "Health Education"],
        "pricing_info": "Free and low-cost care. No one turned away for inability to pay.",
        "price": "0",
        "languages": ["English", "Spanish", "Arabic"],
        "hours": "Monday-Thursday 8:00 AM - 5:00 PM, Friday 8:00 AM - 12:00 PM",
        "walk_in_accepted": True,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.peoplescommunity.org",
        "notes": "Volunteer-run clinic. Donation-based payment system."
    },
    {
        "name": "Lone Star Circle of Care - East Houston",
        "address": "6828 Harrisburg Boulevard, Houston, TX 77011",
        "phone": "(713) 285-8100",
        "services": ["Primary Care", "Pediatrics", "Prenatal Care", "Dental", "Behavioral Health"],
        "pricing_info": "Sliding fee discount program. Uninsured visits start at $30.",
        "price": "30",
        "languages": ["English", "Spanish"],
        "hours": "Monday-Friday 7:30 AM - 6:00 PM, Saturday 8:00 AM - 12:00 PM",
        "walk_in_accepted": True,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.lsccare.org",
        "notes": "FQHC with comprehensive services. Same-day appointments available."
    },
    {
        "name": "Ben Taub Hospital Emergency Department",
        "address": "1504 Taub Loop, Houston, TX 77030",
        "phone": "(713) 873-2000",
        "services": ["Emergency Care", "Trauma", "Critical Care"],
        "pricing_info": "Emergency care cannot be denied. Financial assistance available for uninsured.",
        "price": "50",
        "languages": ["English", "Spanish", "Multiple languages with interpreters"],
        "hours": "24/7 Emergency Services",
        "walk_in_accepted": True,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.harrishealth.org",
        "notes": "Level 1 Trauma Center. EMTALA protections apply - cannot be turned away for emergency care."
    },
    {
        "name": "Pregnancy Help 4 U",
        "address": "4900 Fannin Street, Houston, TX 77004",
        "phone": "(713) 524-4357",
        "services": ["Pregnancy Testing", "Ultrasounds", "STD Testing", "Birth Control", "Women's Health"],
        "pricing_info": "All services provided free of charge.",
        "price": "0",
        "languages": ["English", "Spanish"],
        "hours": "Monday-Friday 9:00 AM - 5:00 PM, Saturday 9:00 AM - 1:00 PM",
        "walk_in_accepted": True,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.pregnancyhelp4u.com",
        "notes": "Free reproductive health services. No insurance or documentation required."
    },
    {
        "name": "Houston Methodist Free Clinic",
        "address": "1111 North Loop West, Houston, TX 77008",
        "phone": "(713) 394-6902",
        "services": ["Primary Care", "Chronic Disease Management", "Health Screenings"],
        "pricing_info": "Completely free for qualifying uninsured patients.",
        "price": "0",
        "languages": ["English", "Spanish"],
        "hours": "Tuesday and Thursday 6:00 PM - 9:00 PM, Saturday 8:00 AM - 12:00 PM",
        "walk_in_accepted": False,
        "lgbtq_friendly": True,
        "immigrant_safe": True,
        "website": "https://www.houstonmethodist.org",
        "notes": "Appointment required. Must meet income eligibility requirements."
    }
]

def seed_database():
    """Seed the MongoDB database with sample clinic data."""
    try:
        # Connect to MongoDB
        client = MongoClient(os.getenv("MONGODB_URI"))
        db = client.care_compass
        clinics_collection = db.clinics
        
        # Clear existing data (for demo purposes)
        print("Clearing existing clinic data...")
        clinics_collection.delete_many({})
        
        # Insert sample data
        print("Inserting sample clinic data...")
        result = clinics_collection.insert_many(SAMPLE_CLINICS)
        
        print(f"Successfully inserted {len(result.inserted_ids)} clinics into the database.")
        
        # Verify insertion
        count = clinics_collection.count_documents({})
        print(f"Total clinics in database: {count}")
        
        # Show a sample clinic
        sample = clinics_collection.find_one()
        if sample:
            print(f"\nSample clinic: {sample['name']}")
            print(f"Address: {sample['address']}")
            print(f"Services: {', '.join(sample['services'])}")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Care Compass Database Seeding Script")
    print("====================================")
    
    if not os.getenv("MONGODB_URI"):
        print("Error: MONGODB_URI environment variable not set.")
        print("Please copy .env.example to .env and configure your MongoDB connection.")
        exit(1)
    
    if seed_database():
        print("\nDatabase seeding completed successfully!")
        print("You can now run the FastAPI server and test the clinic search functionality.")
    else:
        print("\nDatabase seeding failed. Please check your MongoDB connection.")