import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("mongodb+srv://ar155_db_user:fOFTDd0vnh0sMFwj@cluster0.axnlx9w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
GOOGLE_MAPS_API_KEY = os.getenv("AIzaSyBgHWrGOlDhpIC0qpVMbnrm4Xc9wRYipZE")
GEMINI_API_KEY = os.getenv("AIzaSyAInImQl1tsVYvSUlfnWh-HdnNyGoiBqvo")