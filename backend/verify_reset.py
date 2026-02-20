import requests
import json
import sys

BASE_URL = "http://localhost:8000"


def trigger_reset(token):
    print("\n⚠️ Data not clean. Triggering reset...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(f"{BASE_URL}/reset-transactions", headers=headers)
        if resp.status_code == 200:
            print("✅ Reset executed successfully via API.")
            return True
        else:
            print(f"❌ Reset failed: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Reset request failed: {e}")
        return False

def verify_reset():
    # 1. Login
    try:
        resp = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "password"})
        if resp.status_code != 200:
            print(f"❌ Login failed: {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        needs_reset = False
        
        # 2. Check Sales
        print("Checking Sales...")
        sales_resp = requests.get(f"{BASE_URL}/sales", headers=headers)
        sales = sales_resp.json()
        if len(sales) > 0:
             print(f"❌ Sales list NOT empty! Found {len(sales)} items.")
             needs_reset = True
            
        # 3. Check Products Quantities
        print("Checking Products...")
        dash_resp = requests.get(f"{BASE_URL}/dashboard-data", headers=headers)
        products = dash_resp.json().get("products", [])
        
        non_zero = [p for p in products if p['quantite'] > 0]
        if len(non_zero) > 0:
            print(f"❌ Found {len(non_zero)} products with non-zero quantity!")
            needs_reset = True

        if needs_reset:
            if trigger_reset(token):
                print("\n🔄 Re-verifying...")
                # Recursive call or just re-check logic (simplified here)
                sales_resp = requests.get(f"{BASE_URL}/sales", headers=headers)
                print(f"Sales post-reset: {len(sales_resp.json())}")
                
                dash_resp = requests.get(f"{BASE_URL}/dashboard-data", headers=headers)
                non_zero_post = [p for p in dash_resp.json().get("products", []) if p['quantite'] > 0]
                print(f"Non-zero products post-reset: {len(non_zero_post)}")
                
                if len(sales_resp.json()) == 0 and len(non_zero_post) == 0:
                    print("✅ VERIFICATION SUCCESSFUL: System is clean.")
        else:
             print("✅ System checks passed. No reset needed.")

    except Exception as e:
        print(f"❌ Verification failed with error: {e}")

if __name__ == "__main__":
    verify_reset()
