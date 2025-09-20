from pymongo import MongoClient
from app.config import MONGODB_URI

mongo_client = MongoClient(MONGODB_URI)
db = mongo_client.carecompass
clinics_collection = db.clinics