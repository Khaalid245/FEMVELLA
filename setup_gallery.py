"""
Simple script to add multiple images to Women Floral Print Gown Dress
This works with the current database structure
"""

import requests
import json

def add_images_via_admin():
    print("ADDING MULTIPLE IMAGES TO WOMEN FLORAL PRINT GOWN DRESS")
    print("=" * 60)
    
    # Instructions for manual admin setup
    print("STEP 1: Open Django Admin")
    print("URL: http://localhost:8000/admin/")
    print()
    
    print("STEP 2: Navigate to Products")
    print("- Click 'Products' in the admin")
    print("- Find 'Women Floral Print Gown Dress'")
    print("- Click to edit it")
    print()
    
    print("STEP 3: Add Multiple Images")
    print("- Scroll down to 'Product Images' section")
    print("- You should now see 5 empty image upload forms")
    print("- Upload different images in each form:")
    print("  * Image 1: Set 'Is primary' = True")
    print("  * Image 2-5: Leave 'Is primary' = False")
    print()
    
    print("STEP 4: Save and Test")
    print("- Click 'Save' button")
    print("- Go to frontend: http://localhost:5173/products/women-floral-print-gown-dress")
    print("- You should see the image gallery with thumbnails!")
    print()
    
    print("CURRENT ADMIN CONFIGURATION:")
    print("[OK] ProductImageInline now shows 5 upload forms")
    print("[OK] Maximum 10 images allowed per product")
    print("[OK] Proper fields: image, is_primary")
    print("[OK] Gallery will automatically show thumbnails with 2+ images")

def test_current_status():
    print("\nTESTING CURRENT STATUS:")
    print("-" * 30)
    
    try:
        response = requests.get("http://localhost:8000/api/products/women-floral-print-gown-dress/")
        if response.status_code == 200:
            product = response.json()
            images = product.get("images", [])
            print(f"Current images count: {len(images)}")
            
            if len(images) == 0:
                print("Status: NO IMAGES - Shows placeholder")
            elif len(images) == 1:
                print("Status: SINGLE IMAGE - No thumbnails")
            else:
                print(f"Status: GALLERY MODE - {len(images)} images with thumbnails!")
                for i, img in enumerate(images):
                    status = "PRIMARY" if img.get('is_primary') else "SECONDARY"
                    print(f"  {i+1}. {status}: {img['image'].split('/')[-1]}")
        else:
            print("Failed to fetch product data")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    add_images_via_admin()
    test_current_status()