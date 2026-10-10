import os
from PIL import Image, ImageDraw

public_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'public')
os.makedirs(public_dir, exist_ok=True)

def create_icon(size, filename, bg_color=(15, 23, 42), maskable=False):
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw a stylized shopping bag icon in the center
    margin = int(size * 0.25)
    left = margin
    top = int(size * 0.35)
    right = size - margin
    bottom = size - int(size * 0.2)
    
    # Bag body (rounded rectangle)
    draw.rounded_rectangle([left, top, right, bottom], radius=int(size * 0.08), fill=(37, 99, 235))
    
    # Bag handle
    handle_left = left + int(size * 0.12)
    handle_right = right - int(size * 0.12)
    handle_top = top - int(size * 0.12)
    handle_bottom = top + int(size * 0.08)
    
    draw.arc([handle_left, handle_top, handle_right, handle_bottom], start=180, end=0, fill=(255, 255, 255), width=max(2, int(size * 0.04)))
    
    out_path = os.path.join(public_dir, filename)
    img.save(out_path, 'PNG')
    print(f"Created {out_path}")

create_icon(192, 'pwa-192x192.png')
create_icon(512, 'pwa-512x512.png')
create_icon(512, 'pwa-maskable-512x512.png', maskable=True)
create_icon(180, 'apple-touch-icon.png')
