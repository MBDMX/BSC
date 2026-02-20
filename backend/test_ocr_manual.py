
import os
import glob
import subprocess
import ocr_service

def test_ocr():
    # Find the most recent file in uploads
    files = glob.glob("uploads/*")
    if not files:
        print("No files found in uploads/")
        return
        
    latest_file = max(files, key=os.path.getctime)
    print(f"Testing OCR on: {latest_file}")
    
    abs_path = os.path.abspath(latest_file)
    print(f"Absolute path: {abs_path}")
    
    # 1. Test direct PowerShell execution
    print("\n--- Direct PowerShell Test ---")
    script_path = os.path.abspath("win_ocr.ps1")
    cmd = f"powershell -ExecutionPolicy Bypass -Command \"& '{script_path}' '{abs_path}'\""
    print(f"Running command: {cmd}")
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    print(f"Return Code: {result.returncode}")
    print(f"Stdout:\n{result.stdout}")
    print(f"Stderr:\n{result.stderr}")
    
    # 2. Test via ocr_service
    print("\n--- ocr_service Test ---")
    text = ocr_service.extract_text_from_image(abs_path)
    print(f"Extracted Text (Length {len(text)}):\n{text}")
    
    # 3. Test Parsing
    if text:
        data = ocr_service.parse_invoice_data(text)
        print(f"\nParsed Data:\n{data}")

if __name__ == "__main__":
    test_ocr()
