# -*- coding: utf-8 -*-
import asyncio
import os
import re
from datetime import date

# winsdk imports
from winsdk.windows.globalization import Language
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.storage import FileAccessMode

async def extract_text_from_image(image_path):
    """Extract text using Windows OCR (async"""
    print(f"DEBUG: OCR Starting on {image_path}")
    try:
        abs_path = os.path.abspath(image_path)
        if not os.path.exists(abs_path):
            print(f"DEBUG: File not found: {abs_path}")
            return "ERROR: File not found."
            
        # 1. Load File
        file = await StorageFile.get_file_from_path_async(abs_path)
        print(f"DEBUG: File loaded into winsdk storage")
        
        # 2. Open Stream
        stream = await file.open_async(FileAccessMode.READ)
        print(f"DEBUG: Stream opened")
        
        # 3. Decode Bitmap
        decoder = await BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        print(f"DEBUG: Bitmap decoded ({bitmap.pixel_width}x{bitmap.pixel_height})")
        
        # 4. OCR Engine
        lang = Language("fr-FR")
        engine = OcrEngine.try_create_from_language(lang)
        if not engine:
            engine = OcrEngine.try_create_from_user_profile_languages()
        print(f"DEBUG: Using OCR Engine: {engine.recognizer_language.display_name}")
        
       # 5. Recognize
        result = await engine.recognize_async(bitmap)
        print(f"DEBUG: Text extracted ({len(result.text)} chars)")
        
        return result.text or ""
    except Exception as e:
        print(f"DEBUG: Native OCR Exception: {e}")
        import traceback
        traceback.print_exc()
        return f"ERROR: {str(e)}"


def parse_invoice_data(text):
    """Parse invoice OCR text to extract: supplier, date, total_amount, items."""
    data = {
        "supplier_name": None,
        "invoice_date": None,
        "total_amount": 0,
        "items": []
    }
    
    # 1. Total Amount Extraction
    # Look for patterns like "Total : 850 DT" or "Total: 630 DT"
    total_patterns = [
        r"total\s*:?\s*(\d+[.,]?\d*)\s*(?:DT|TND|Dinars?)?",
        r"(\d+[.,]?\d*)\s*DT",
        r"montant\s*:?\s*(\d+[.,]?\d*)"
    ]
    
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            total_str = match.group(1).replace(',', '.')
            try:
                data["total_amount"] = float(total_str)
                print(f"✅ Total found: {data['total_amount']}")
                break
            except:
                pass
    
    # 2. Date Extraction
    date_patterns = [
        r"date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})"
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["invoice_date"] = match.group(1)
            break

    # 3. Item Extraction - TABULAR FORMAT DETECTION
    print("\n=== ITEM EXTRACTION ===")
    
    # Known product keywords (multilingual)
    known_products = [
        "viande", "meat", "لحم",
        "ognon", "oignon", "onion", "بصل",
        "pomme de terre", "pomme", "potato", "بطاطا",
        "poulet", "chicken", "دجاج",
        "lait", "milk", "حليب",
        "oeuf", "egg", "بيض",
        "farine", "flour", "دقيق",
        "huile", "oil", "زيت",
        "fromage", "cheese", "جبن",
        "pain", "bread", "خبز",
        "tomate", "tomato", "طماطم",
        "laitue", "lettuce", "خس"
    ]
    
    # Try to detect tabular structure like:
    # Désignation Oil Flour Cheese
    # Quantités 20 50 8
    # Montant 320 200 110
    
    words = text.split()  
    products_found = []
    quantities_found = []
    
    # Step 1: Extract all product names
    for i, word in enumerate(words):
        w_low = word.lower().strip('(),.:;-')
        for known_prod in known_products:
            if known_prod in w_low or w_low in known_prod:
                products_found.append((i, word, known_prod))
                print(f"Found product: {word} at position {i}")
                break
    
    # Step 2: Find "Quantités" keyword and extract following numbers
    for i, word in enumerate(words):
        if "quantit" in word.lower():
            print(f"Found 'Quantités' at position {i}")
            # Extract all numbers after "Quantités"
            for j in range(i+1, min(i+20, len(words))):
                try:
                    num_str = words[j].replace(',', '.').strip()
                    # Skip invoice numbers (5+ digits)
                    if re.match(r"^\d{5,}$", num_str):
                        continue
                    if re.match(r"^\d+(\.\d+)?$", num_str):
                        val = float(num_str)
                        if 0 < val < 1000:
                            quantities_found.append(val)
                            print(f"  Quantity found: {val}")
                        if len(quantities_found) >= len(products_found):
                            break
                except:
                    continue
            break
    
    # Step 3: Match products with quantities (1-to-1)
    print(f"\n=== MATCHING ===")
    print(f"Products: {len(products_found)}, Quantities: {len(quantities_found)}")
    
    for idx, (pos, original_name, known_name) in enumerate(products_found):
        if idx < len(quantities_found):
            quantity = quantities_found[idx]
            display_name = original_name.capitalize()
            
            data["items"].append({
                "name": display_name,
                "quantity": quantity,
                "unit_price": 0,
                "total": 0
            })
            print(f"✅ Matched: {display_name} → {quantity}")
    
    return data
