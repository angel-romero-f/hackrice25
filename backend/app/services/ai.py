import google.generativeai as genai
from app.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')


business_name = "Houston Plaza OBGYN Obstetrics and Gynecology"
User_reviews = [
    "Dr. Anika Galagoda has my 10/10 recommendation as an OB. She listens and she’s informative. She is confident and cool.. she looks so young so at first I was nervous but she very professional and took everything head on! I have a seamless c-section scar and we had no problems delivering my daughter! She was fast and careful and did I mention very good energy! S/o to Parkplaza MD!!",
    
    "I am beyond grateful for Dr Islam Balat. Been his patient for the past 25 years. He makes me feel so comfortable and truly cared for at every appointment. He listens without judgment, explains everything in detail, and always makes sure I leave with peace of mind. It’s rare to find a doctor who combines such professionalism with genuine compassion. I feel very lucky to have him as my gynecologist.",
    
    "Friendly staff! I am very pleased by the care I got from Dr. Michael Balat. He patiently and respectfully listened to all of my questions. The answers he gave me were informative and satisfying. He and I worked out a treatment for me that I feel comfortable with. I would confidently recommend him!"
]

def generate_review(clinic_name, review_data):
    prompt = f"You are a professional, but friendly AI assistant giving users the run-down on patient experience at a clinic they are interested in going to. Write a no more than 100-word Google review for {clinic_name} based on the following user reviews: " + " ".join(review_data)
    response =  model.generate_content(prompt)
    return response.text
