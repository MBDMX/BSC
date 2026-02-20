
import requests
import os
import json

API_URL = "http://localhost:8000"
IMAGE_PATH = r"C:/Users/Mohamed BR/.gemini/antigravity/brain/23a58164-d235-43dd-8c0d-6d8dee6a2ac9/uploaded_media_1769902909987.png"

def test_flow():
    print("\n--- 1. Upload Invoice ---")
    if not os.path.exists(IMAGE_PATH):
        print("Test image not found!")
        return

    try:
        files = {'file': open(IMAGE_PATH, 'rb')}
        res = requests.post(f"{API_URL}/invoices/upload", files=files)
        if res.status_code != 200:
            print(f"Upload STATUS: {res.status_code}")
            print(f"Upload ERROR: {res.text}")
            return
        
        invoice = res.json()
        print(f"Invoice ID: {invoice['id']}")
        print(f"Extracted Supplier: {invoice['extracted_data'].get('supplier_name', 'N/A')}")
        print(f"Extracted Total: {invoice['extracted_data'].get('total_amount', 0)}")
        print("Items Found:")
        for item in invoice['extracted_data'].get('items', []):
            print(f" - {item['name']}: {item['quantity']} units ({item['total']} TND)")
            
        # Verify Meat Detection
        meat_item = next((i for i in invoice['extracted_data']['items'] if "viande" in i['name'].lower() or "meat" in i['name'].lower()), None)
        if not meat_item:
            print("❌ FAILURE: Meat not detected in OCR items")
        else:
            print(f"✅ SUCCESS: Meat detected: {meat_item}")

    except Exception as e:
        print(f"Upload failed: {e}")
        return

if __name__ == "__main__":
    test_flow()
