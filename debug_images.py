import requests
import json

# Test the API and add images to products without them
def add_images_to_products():
    base_url = "http://localhost:8000/api"
    
    # Get all products
    response = requests.get(f"{base_url}/products/")
    if response.status_code != 200:
        print("Failed to fetch products")
        return
    
    products = response.json()["results"]
    
    # Find products without images
    products_without_images = [p for p in products if not p["images"]]
    
    print(f"Found {len(products_without_images)} products without images:")
    for product in products_without_images:
        print(f"- {product['name']} (ID: {product['id']})")
    
    # Available sample images from the media folder
    sample_images = [
        "products/images_2.jpg",
        "products/images_3.jpg", 
        "products/download_1.jpg",
        "products/Limited_edition_abaya_mobile_banner_1.webp",
        "products/WhatsAppImage2025-08-12at21.05.26_b698d6ca.webp"
    ]
    
    print(f"\nAvailable sample images: {len(sample_images)}")
    print("Note: This script shows the issue analysis. To fix, add images via Django admin.")

if __name__ == "__main__":
    add_images_to_products()