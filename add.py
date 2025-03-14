import requests
import json

url = "https://api-j92y.onrender.com/recommendations"

payload = {
    "animeId": 95,
    "publisherId": "anime_ray_1735153685779_d9tgi94li",
    "summary": "A brief description of the season"
}

headers = {
    "Content-Type": "application/json"
}

for i in range(500):
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Request {i+1}: Status Code {response.status_code}")
