from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

uri = os.getenv("MONGO_URI")

client = MongoClient(
    uri,
    serverSelectionTimeoutMS=10000
)

print("Testing MongoDB Atlas connection...")

try:
    print(client.admin.command("ping"))
    print("SUCCESS - MongoDB Atlas connected!")
except Exception as e:
    print("FAILED")
    print(repr(e))