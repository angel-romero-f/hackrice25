from pymongo import MongoClient
from app.config import MONGODB_URI

# MongoDB Atlas connection
# Let PyMongo handle TLS for mongodb+srv URIs. Install CA certs in the image.
try:
    mongo_client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=20000,
        connectTimeoutMS=20000,
        socketTimeoutMS=20000,
    )

    # Test the connection
    mongo_client.admin.command('ping')
    print("MongoDB connection successful")

except Exception as e:
    print(f"MongoDB connection failed: {e}")
    mongo_client = None

# Default database/collection names
# If your URI includes a database in the path, PyMongo will select it.
# Otherwise we use "carecompass" explicitly here.
if mongo_client:
    try:
        db = mongo_client.get_default_database() or mongo_client["carecompass"]
    except Exception:
        db = mongo_client["carecompass"]
    clinics_collection = db["clinics"]
    chat_sessions_collection = db["chat_sessions"]

    # Create TTL index for automatic session cleanup (expires after 24 hours)
    try:
        chat_sessions_collection.create_index(
            "last_activity",
            expireAfterSeconds=86400  # 24 hours in seconds
        )
        print("TTL index created for chat_sessions collection")
    except Exception as e:
        print(f"Note: TTL index creation: {e}")

else:
    db = None
    clinics_collection = None
    chat_sessions_collection = None
