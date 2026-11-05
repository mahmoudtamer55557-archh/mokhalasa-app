import os
from PIL import Image, ImageDraw, ImageFont

public_dir = r"C:\Users\tamer.salah\.gemini\antigravity\scratch\mokhalasa-app\public"

def create_brand_icon(size):
    # Create high-res canvas (4x supersampling)
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Rounded rect background (#0B2D4A)
    corner_radius = int(canvas_size * 0.22)
    navy = (11, 45, 74, 255)
    draw.rounded_rectangle([0, 0, canvas_size - 1, canvas_size - 1], radius=corner_radius, fill=navy)
    
    # White "م"
    # Choose font
    font_path = "C:/Windows/Fonts/tahoma.ttf"
    if not os.path.exists(font_path):
        font_path = "C:/Windows/Fonts/arial.ttf"
        
    font_size = int(canvas_size * 0.58)
    font = ImageFont.truetype(font_path, font_size)
    
    text = "م"
    # Measure text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # Center text
    x = (canvas_size - text_w) // 2 - bbox[0]
    y = (canvas_size - text_h) // 2 - bbox[1] + int(canvas_size * 0.04)
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    
    # Emerald dot (#10B981) at top-right
    dot_r = int(canvas_size * 0.08)
    dot_cx = int(canvas_size * 0.72)
    dot_cy = int(canvas_size * 0.26)
    emerald = (16, 185, 129, 255)
    draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=emerald)
    
    # Resize back with high quality Lanczos filter
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

# Generate icons
icon_512 = create_brand_icon(512)
icon_512.save(os.path.join(public_dir, "favicon-512x512.png"), "PNG")
icon_512.save(os.path.join(public_dir, "logo.png"), "PNG")

icon_192 = create_brand_icon(192)
icon_192.save(os.path.join(public_dir, "favicon-192x192.png"), "PNG")

icon_180 = create_brand_icon(180)
icon_180.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")

icon_96 = create_brand_icon(96)
icon_96.save(os.path.join(public_dir, "favicon-96x96.png"), "PNG")

icon_48 = create_brand_icon(48)
icon_48.save(os.path.join(public_dir, "favicon-48x48.png"), "PNG")

icon_32 = create_brand_icon(32)
icon_32.save(os.path.join(public_dir, "favicon-32x32.png"), "PNG")

icon_16 = create_brand_icon(16)
icon_16.save(os.path.join(public_dir, "favicon-16x16.png"), "PNG")

# Generate multi-size favicon.ico
icon_512.save(
    os.path.join(public_dir, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
)

print("Icons generated successfully!")
