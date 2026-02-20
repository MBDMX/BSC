
import os
import asyncio
import winsdk.windows.media.ocr as ocr
import winsdk.windows.graphics.imaging as imaging
import winsdk.windows.storage as storage
import winsdk.windows.storage.streams as streams
import winsdk.windows.globalization as glob
from PIL import Image
import re

# === NATIVE WINDOWS OCR IMPLEMENTATION (Direct Async) ===
async def extract_text_from_image(image_path):
    print(f"DEBUG: OCR Starting on {image_path}")
    try:
        abs_path = os.path.abspath(image_path)
        if not os.path.exists(abs_path):
            print(f"DEBUG: File not found: {abs_path}")
            return "ERROR: File not found."
            
        # 1. Load File
        file = await storage.StorageFile.get_file_from_path_async(abs_path)
        print(f"DEBUG: File loaded into winsdk storage")
        
        # 2. Open Stream
        stream = await file.open_async(storage.FileAccessMode.READ)
        print(f"DEBUG: Stream opened")
        
        # 3. Decode Bitmap
        decoder = await imaging.BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        print(f"DEBUG: Bitmap decoded ({bitmap.pixel_width}x{bitmap.pixel_height})")
        
        # 4. Create Engine
        engine = ocr.OcrEngine.try_create_from_user_profile_languages()
        if not engine:
            print("DEBUG: Profile language engine failed, trying fr-FR")
            engine = ocr.OcrEngine.try_create_from_language(glob.Language("fr-FR"))
        if not engine:
            print("DEBUG: fr-FR engine failed, trying en-US")
            engine = ocr.OcrEngine.try_create_from_language(glob.Language("en-US"))
            
        if not engine:
            print("DEBUG: ERROR - No OCR Engine available on this system.")
            return "ERROR: No OCR Engine available."

        print(f"DEBUG: Using OCR Engine: {engine.recognizer_language.display_name}")

        # 5. Recognize
        result = await engine.recognize_async(bitmap)
        if not result or not result.text:
            print("DEBUG: Recognize returned empty result")
            return "Aucun texte extrait."
            
        print(f"DEBUG: Text extracted ({len(result.text)} chars)")
        return result.text
        
    except Exception as e:
        print(f"DEBUG: Native OCR Exception: {e}")
        import traceback
        traceback.print_exc()
        return f"ERROR: {str(e)}"

async def extract_text_from_pdf(pdf_path):
    # PDF not supported by Native OCR directly, needs conversion
    return ""

def parse_invoice_data(text):
    """
    Heuristic parsing of invoice data from raw text.
    Looks for Total, Date, Supplier, and Itemized lines.
    """
    data = {
        "total_amount": 0.0,
        "invoice_date": None,
        "supplier_name": None,
        "items": []
    }
    
    # 1. Total Detection (More aggressive)
    total_patterns = [
        r"(?:total|montant|payer|paye|ttc|net|somme)[:\s\.]+(?:[^\d]*?)([0-9]{2,}(?:[.,][0-9]+)?)\s*(?:dt|tnd|dinars|dinar|€|\$)?", # "Total : 850 DT"
        r"([0-9]{2,}(?:[.,][0-9]+)?)\s*(?:dt|tnd|dinars|dinar|€|\$)", # "850 DT"
        r"(?:total|montant)[:\s]+([0-9]{2,})" # "Total 850"
    ]
    
    # Try to find a decimal value first (X.XXX)
    found_total = False
    for pattern in total_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for m in matches:
            try:
                raw_val = m.group(1).strip().replace(' ', '').replace(',', '.')
                # Handle cases with multiple dots (e.g. 1.250.000)
                if raw_val.count('.') > 1:
                    parts = raw_val.split('.')
                    raw_val = "".join(parts[:-1]) + "." + parts[-1]
                
                val = float(raw_val)
                if val > 1 and val > data["total_amount"]: # Pick the largest sensible value
                    data["total_amount"] = val
                    found_total = True
            except: continue
        if found_total: break

    # 2. Look for Date (Flexible)
    date_patterns = [
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        r"le\s*(\d{1,2}\s+\w+\s+\d{4})",
        r"(\d{2}/\d{2}/\d{2,4})",
        r"(\d{4}[/-]\d{1,2}[/-]\d{1,2})"
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["invoice_date"] = match.group(1)
            break

    # 3. Item Extraction - TABULAR FORMAT DETECTION
    print("\n=== ITEM EXTRACTION ===")
