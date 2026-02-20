# -*- coding: utf-8 -*-
import asyncio
import os
import re
from datetime import datetime, date

# winsdk imports
from winsdk.windows.globalization import Language
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.storage import FileAccessMode

async def extract_text_from_image(image_path):
    """Extract text using Windows OCR (async) and return structured line data."""
    print(f"DEBUG: OCR Starting on {image_path}")
    try:
        abs_path = os.path.abspath(image_path)
        if not os.path.exists(abs_path):
            return {"text": "", "lines": []}
            
        file = await StorageFile.get_file_from_path_async(abs_path)
        stream = await file.open_async(FileAccessMode.READ)
        decoder = await BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        
        lang = Language("fr-FR")
        engine = OcrEngine.try_create_from_language(lang)
        if not engine:
            engine = OcrEngine.try_create_from_user_profile_languages()
        
        result = await engine.recognize_async(bitmap)
        
        structured_lines = []
        for line in result.lines:
            line_item = {"text": line.text, "words": []}
            for word in line.words:
                line_item["words"].append({
                    "text": word.text,
                    "x": word.bounding_rect.x,
                    "y": word.bounding_rect.y,
                    "w": word.bounding_rect.width,
                    "h": word.bounding_rect.height
                })
            structured_lines.append(line_item)
            
        return {
            "text": result.text or "",
            "lines": structured_lines
        }
    except Exception as e:
        print(f"DEBUG: Native OCR Exception: {e}")
        return {"text": f"ERROR: {str(e)}", "lines": []}


def parse_invoice_data(ocr_result):
    """Parse structured OCR with Spacial Row Clustering and Table Anchors."""
    if isinstance(ocr_result, str):
        return {"text": ocr_result, "items": []}
        
    text = ocr_result.get("text", "")
    lines = ocr_result.get("lines", [])
    
    data = {
        "supplier_name": None,
        "invoice_date": None,
        "total_amount": 0,
        "items": []
    }
    
    # 1. Patterns for Total and Date
    norm_text = text.lower().replace('o', '0').replace('о', '0')
    total_match = re.search(r"(?:total|montant)\s*[:=]?\s*(\d+[.,]?\d*)", norm_text)
    if total_match:
        try: data["total_amount"] = float(total_match.group(1).replace(',', '.'))
        except: pass
        
    date_match = re.search(r"(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})", text)
    if date_match: data["invoice_date"] = date_match.group(1)

    # 2. Row Clustering Algorithm (Strict 15px Separation)
    all_words = []
    for line in lines:
        for word in line["words"]:
            all_words.append(word)
    
    rows = []
    if all_words:
        # Sort by vertical center of the word
        sorted_words = sorted(all_words, key=lambda w: w["y"] + (w["h"] / 2))
        current_row = [sorted_words[0]]
        avg_y = sorted_words[0]["y"] + (sorted_words[0]["h"] / 2)
        
        for i in range(1, len(sorted_words)):
            w = sorted_words[i]
            cy = w["y"] + (w["h"] / 2)
            # Threshold 20px (Balanced for hand-written invoices)
            if abs(cy - avg_y) < 20: 
                current_row.append(w)
                avg_y = sum([x["y"] + (x["h"] / 2) for x in current_row]) / len(current_row)
            else:
                rows.append(sorted(current_row, key=lambda r: r["x"]))
                current_row = [w]
                avg_y = cy
        rows.append(sorted(current_row, key=lambda r: r["x"]))

    # 3. Product Matching Logic
    known_products = ["viande", "meat", "لحم", "ognon", "oignon", "onion", "بصل", "potato", "pomme", "fries", "chicken", "poulet", "egg", "oeuf", "pain", "bread"]
    synonyms_map = {
        "meat": "Meat", "viande": "Meat", "onion": "Ognon", "ognon": "Ognon", "oignon": "Ognon",
        "potato": "Fries", "fries": "Fries", "pomme": "Fries", "chicken": "Chicken", "poulet": "Chicken"
    }
    blacklist = ["total", "adresse", "facture", "signature", "téléphone", "gotex", "marché", "vendeur", "tva", "timbre", "fiscale"]

    # 4. Table Boundary Detection (Product Anchor)
    table_boundary_y = -1
    qty_x_anchor = -1
    total_x_anchor = -1
    
    # Pass 1: find the first line that belongs to the table
    for row in rows:
        row_text_low = " ".join([w["text"].lower() for w in row])
        # Look for header line
        is_header = any(h in row_text_low for h in ["désignation", "article", "produit", "quantité", "montant"])
        # Look for product line
        is_product = any(p in row_text_low for p in known_products)
        
        if is_header or is_product:
            if table_boundary_y == -1:
                table_boundary_y = row[0]["y"]
            # Try to grab column anchors from header
            if is_header:
                for w in row:
                    t = w["text"].lower()
                    if any(q in t for q in ["quant", "qté", "qty"]): qty_x_anchor = w["x"] + (w["w"]/2)
                    if any(m in t for m in ["montant", "total", "prix"]): total_x_anchor = w["x"] + (w["w"]/2)

    # 5. Row Processing (Strict Filtering)
    for row in rows:
        row_y = row[0]["y"]
        row_text = " ".join([w["text"] for w in row])
        row_text_low = row_text.lower()
        
        # A. BLOCK HEADER NOISE
        if table_boundary_y != -1 and row_y < table_boundary_y - 10:
            continue
            
        # B. BLOCK DATE ROWS
        if re.search(r"\d[\/\-\.]\d[\/\-\.]\d", row_text):
            continue
            
        # C. BLOCK NOISE
        if any(b in row_text_low for b in blacklist) and not any(p in row_text_low for p in known_products):
            continue
        if re.match(r"^[0-9.,\s:;/\-dtDT]+$", row_text_low.strip()):
            continue
        if "signature" in row_text_low:
            break

        # 6. Extract Product and Numbers
        match_cat = None
        main_word = None
        for w in row:
            wc = w["text"].lower().strip('(),.:;- ')
            for kp in known_products:
                if kp == wc or (len(wc) > 3 and kp in wc):
                    match_cat = synonyms_map.get(kp) or kp.capitalize()
                    main_word = w
                    break
            if match_cat: break
        
        if not match_cat: continue
        
        nums = []
        for w in row:
            if w == main_word: continue
            raw = w["text"].upper().replace('DT','').replace('TND','').replace(',','.').strip('() :;,-')
            # Aggressive OCR normalization (I->1, O->0, S->5, Z->2, B->8, G->6)
            fixed = raw.translate(str.maketrans('IOSZBG', '105286')).replace('LO','10')
            match = re.search(r"(\d+[.,]?\d*)", fixed)
            if match:
                try:
                    val = float(match.group(1))
                    if 0 < val < 100000 and not (2020 <= val <= 2035):
                        nums.append({"val": val, "x": w["x"] + (w["w"]/2)})
                except: pass
        
        if not nums: continue
        
        # 7. Assignment Logic
        qty = 0
        total = 0
        
        # Only consider numbers to the right of the product name
        candidates = [n for n in nums if n["x"] > main_word["x"] + 10]
        candidates.sort(key=lambda c: c["x"])
        
        if len(candidates) >= 2:
            # If we have anchors, use them with wider thresholds
            if qty_x_anchor != -1 or total_x_anchor != -1:
                for n in candidates:
                    dq = abs(n["x"] - qty_x_anchor) if qty_x_anchor != -1 else 9999
                    dt = abs(n["x"] - total_x_anchor) if total_x_anchor != -1 else 9999
                    if dq < dt and dq < 180: qty = n["val"]
                    elif dt <= dq and dt < 250: total = n["val"]
            
            # Sequence Fallback
            if qty == 0 or total == 0:
                qty = candidates[0]["val"]
                total = candidates[-1]["val"]
        elif len(candidates) == 1:
            # If only one num, is it more likely Qty or Total?
            val = candidates[0]["val"]
            if total_x_anchor != -1 and abs(candidates[0]["x"] - total_x_anchor) < 150:
                total = val
            else:
                qty = val
            
        if qty > 0:
            data["items"].append({
                "name": match_cat,
                "quantity": qty,
                "unit_price": round(total/qty, 2) if total > 0 else 0,
                "total": total
            })
            print(f"DEBUG OCR: ✅ {match_cat} -> Qty={qty}, Total={total}")

    return data
