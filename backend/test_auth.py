import requests
import sys

BASE_URL = "http://localhost:8000"

def test_auth():
    print(f"Testing Auth at {BASE_URL}...")
    
    # 1. Register
    email = "testuser@example.com"
    password = "password123"
    
    print("Attempting Register...")
    try:
        reg_res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
        print(f"Register Status: {reg_res.status_code}")
        print(f"Register Response: {reg_res.text}")
    except Exception as e:
        print(f"Register Failed: {e}")
        return

    # 2. Login
    print("Attempting Login...")
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        print(f"Login Status: {login_res.status_code}")
        print(f"Login Response: {login_res.text}")
        
        if login_res.status_code == 200:
            token = login_res.json().get("token")
            print(f"Got Token: {token[:10]}...")
        else:
            print("Login failed to get token")
    except Exception as e:
        print(f"Login Failed: {e}")

if __name__ == "__main__":
    test_auth()
