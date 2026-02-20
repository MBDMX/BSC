
import asyncio
import os
import winsdk.windows.media.ocr as ocr
import winsdk.windows.graphics.imaging as imaging
import winsdk.windows.storage as storage
import winsdk.windows.globalization as glob

IMAGE_PATH = r"uploads/ChatGPT Image 31 janv. 2026, 22_32_57.png"

async def test_ocr():
    try:
        print(f"Testing OCR on: {IMAGE_PATH}")
        abs_path = os.path.abspath(IMAGE_PATH)
        
        # 1. Load File
        file = await storage.StorageFile.get_file_from_path_async(abs_path)
        
        # 2. Open Stream
        stream = await file.open_async(storage.FileAccessMode.READ)
        
        # 3. Decode Bitmap
        decoder = await imaging.BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        
        # 4. Create Engine
        engine = ocr.OcrEngine.try_create_from_user_profile_languages()
        if not engine:
            print("Profile language failed, trying en-US...")
            engine = ocr.OcrEngine.try_create_from_language(glob.Language("en-US"))
            
        if engine:
            print(f"Engine: {engine.recognizer_language.display_name}")
            result = await engine.recognize_async(bitmap)
            print("--- RAW TEXT START ---")
            print(result.text)
            print("--- RAW TEXT END ---")
        else:
            print("ERROR: Could not create OCR Engine.")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_ocr())
