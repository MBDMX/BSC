"""
Test the consumption analytics endpoint
"""
import requests

def test_consumption_endpoint():
    print("=" * 60)
    print("TESTING CONSUMPTION ANALYTICS ENDPOINT")
    print("=" * 60)
    
    # Login first to get token
    login_response = requests.post(
        "http://localhost:8000/login",
        json={"username": "admin", "password": "admin"}
    )
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test daily consumption
    print("\n1. Testing DAILY consumption:")
    response = requests.get(
        "http://localhost:8000/analytics/consumption?period=daily",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data['success']}")
        print(f"Period: {data['period']}")
        print(f"Data count: {len(data['data'])}")
        if data['data']:
            print(f"Sample: {data['data'][0]}")
    else:
        print(f"Error: {response.text}")
    
    # Test weekly consumption
    print("\n2. Testing WEEKLY consumption:")
    response = requests.get(
        "http://localhost:8000/analytics/consumption?period=weekly",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Data count: {len(data['data'])}")
    
    # Test monthly consumption
    print("\n3. Testing MONTHLY consumption:")
    response = requests.get(
        "http://localhost:8000/analytics/consumption?period=monthly",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Data count: {len(data['data'])}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_consumption_endpoint()
