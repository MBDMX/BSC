import requests
import os

def verify_invoice_flow():
    base_url = "http://localhost:8000"
    image_path = "C:/Users/Mohamed BR/.gemini/antigravity/brain/23a58164-d235-43dd-8c0d-6d8dee6a2ac9/test_invoice_bsc_1769890418966.png"
    
    print("Step 1: Uploading Invoice...")
    with open(image_path, "rb") as f:
        files = {"file": f}
        headers = {"Authorization": "Bearer fake_token"}
        response = requests.post(f"{base_url}/invoices/upload", files=files, headers=headers)
    
    if response.status_code != 200:
        print(f"Upload failed: {response.status_code} - {response.text}")
        return

    result = response.json()
    print("Upload Success!")
    print(f"Invoice ID: {result['id']}")
    print(f"Extracted Data: {result['extracted_data']}")
    
    # Check if OCR found the values
    data = result['extracted_data']
    if data['total_amount'] == 120.0:
        print("✅ OCR corrected extracted total: 120.0")
    else:
        print(f"❌ OCR extracted unexpected total: {data['total_amount']}")

    print("\nStep 2: Confirming Invoice...")
    confirm_data = {
        "supplier_name": data['supplier_name'] or "METRO",
        "total_amount": data['total_amount'] or 120.0,
        "date": "2026-01-31"
    }
    confirm_res = requests.post(f"{base_url}/invoices/{result['id']}/confirm", json=confirm_data, headers=headers)
    
    if confirm_res.status_code == 200:
        print("✅ Invoice Confirmed Successfully!")
    else:
        print(f"❌ Confirmation failed: {confirm_res.status_code} - {confirm_res.text}")

if __name__ == "__main__":
    verify_invoice_flow()
