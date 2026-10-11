"""
Generate production release assets for Lexora.
Brand Emblem:
- 2x2 Minimalist Wordle-inspired grid spelling "L E X" (Lexora)
  - Tile (0,0): 'L' in Lexora Brand Orange (#FF7A00)
  - Tile (1,0): 'E' in Correct Green (#538D4E)
  - Tile (0,1): 'X' in Present Yellow (#B59F3B)
  - Tile (1,1): Active Empty Tile in Dark Surface (#292019) with #45372E border
- Elevated dark plaque (#261C15) on deep espresso background (#1A100A)
- High-resolution super-sampled rendering with smooth antialiasing
"""
import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets"))
os.makedirs(ASSETS_DIR, exist_ok=True)

# Brand Color Palette
COLOR_BG = (26, 16, 10, 255)            # #1A100A deep espresso
COLOR_CARD = (38, 28, 21, 255)          # #261C15 elevated plaque
COLOR_CARD_BORDER = (69, 55, 46, 255)   # #45372E plaque border
COLOR_ORANGE = (255, 122, 0, 255)       # #FF7A00 brand primary
COLOR_ORANGE_BORDER = (255, 150, 40, 255)
COLOR_GREEN = (83, 141, 78, 255)        # #538D4E correct letter
COLOR_GREEN_BORDER = (110, 175, 105, 255)
COLOR_YELLOW = (181, 159, 59, 255)      # #B59F3B present letter
COLOR_YELLOW_BORDER = (210, 185, 80, 255)
COLOR_SURFACE = (41, 32, 25, 255)       # #292019 empty tile
COLOR_SURFACE_BORDER = (69, 55, 46, 255)
COLOR_TEXT = (255, 248, 240, 255)       # #FFF8F0 ivory
COLOR_MUTED = (184, 170, 160, 255)      # #B8AAA0 subtitle

FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
FONT_REG = "C:/Windows/Fonts/arial.ttf"

def draw_lex_emblem(draw, center_x, center_y, card_size, scale=1, with_shadow=False):
    """Draws the signature 2x2 L-E-X emblem inside an elevated card."""
    half_card = card_size / 2.0
    cx1 = center_x - half_card
    cy1 = center_y - half_card
    cx2 = center_x + half_card
    cy2 = center_y + half_card
    card_radius = int(card_size * 0.18)

    # Optional symmetric ambient shadow
    if with_shadow:
        shadow_steps = int(16 * scale)
        for s in range(shadow_steps, 0, -int(2 * scale)):
            draw.rounded_rectangle(
                [cx1 - s, cy1 - s, cx2 + s, cy2 + s],
                radius=card_radius + s,
                fill=(14, 8, 5, int(40 * (1.0 - s / shadow_steps)))
            )

    # Card background & border
    draw.rounded_rectangle(
        [cx1, cy1, cx2, cy2],
        radius=card_radius,
        fill=COLOR_CARD,
        outline=COLOR_CARD_BORDER,
        width=max(1, int(4 * scale))
    )

    # Tile layout
    inner_padding = card_size * 0.08
    gap = card_size * 0.06
    tile_size = (card_size - (2 * inner_padding) - gap) / 2.0
    tile_radius = int(tile_size * 0.22)
    border_w = max(1, int(3 * scale))

    start_x = cx1 + inner_padding
    start_y = cy1 + inner_padding

    tiles = [
        (0, 0, COLOR_ORANGE, COLOR_ORANGE_BORDER, 'L'),
        (1, 0, COLOR_GREEN, COLOR_GREEN_BORDER, 'E'),
        (0, 1, COLOR_YELLOW, COLOR_YELLOW_BORDER, 'X'),
        (1, 1, COLOR_SURFACE, COLOR_SURFACE_BORDER, '')
    ]

    font_size = int(tile_size * 0.62)
    try:
        font = ImageFont.truetype(FONT_BOLD, font_size)
    except Exception:
        font = ImageFont.load_default()

    for col, row, fill, outline, letter in tiles:
        tx1 = start_x + col * (tile_size + gap)
        ty1 = start_y + row * (tile_size + gap)
        tx2 = tx1 + tile_size
        ty2 = ty1 + tile_size
        draw.rounded_rectangle(
            [tx1, ty1, tx2, ty2],
            radius=tile_radius,
            fill=fill,
            outline=outline,
            width=border_w
        )
        if letter:
            bbox = draw.textbbox((0, 0), letter, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            lx = tx1 + (tile_size - tw) / 2.0 - bbox[0]
            ly = ty1 + (tile_size - th) / 2.0 - bbox[1]
            draw.text((lx, ly), letter, font=font, fill=COLOR_TEXT)

def generate_app_icon():
    """Generate 1024x1024 icon.png (fully opaque for Apple App Store & Google Play)."""
    scale = 2
    size = 1024 * scale
    img = Image.new("RGBA", (size, size), COLOR_BG)
    draw = ImageDraw.Draw(img)

    center = size // 2
    card_size = int(720 * scale)
    draw_lex_emblem(draw, center, center, card_size, scale=scale, with_shadow=True)

    final_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    out_path = os.path.join(ASSETS_DIR, "icon.png")
    final_img.convert("RGB").save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({final_img.size})")

def generate_android_foreground():
    """
    Generate 512x512 android-icon-foreground.png.
    Adaptive icon safe zone is center circle of diameter ~338px.
    We set card_size = 310px to guarantee 100% containment within the safe area.
    """
    scale = 2
    size = 512 * scale
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    card_size = int(300 * scale)
    draw_lex_emblem(draw, center, center, card_size, scale=scale, with_shadow=False)

    final_img = img.resize((512, 512), Image.Resampling.LANCZOS)
    out_path = os.path.join(ASSETS_DIR, "android-icon-foreground.png")
    final_img.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({final_img.size})")

def generate_android_background():
    """Generate 512x512 android-icon-background.png."""
    img = Image.new("RGB", (512, 512), (26, 16, 10))
    out_path = os.path.join(ASSETS_DIR, "android-icon-background.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({img.size})")

def generate_android_monochrome():
    """
    Generate 432x432 android-icon-monochrome.png for Android 13+ Material You themed icons.
    Silhouette rendered as solid white tiles with cutout letters.
    """
    scale = 2
    size = 432 * scale
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    card_size = int(250 * scale)
    half_card = card_size / 2.0
    cx1 = center - half_card
    cy1 = center - half_card

    inner_padding = card_size * 0.08
    gap = card_size * 0.06
    tile_size = (card_size - (2 * inner_padding) - gap) / 2.0
    tile_radius = int(tile_size * 0.22)
    border_w = max(1, int(3 * scale))

    start_x = cx1 + inner_padding
    start_y = cy1 + inner_padding

    font_size = int(tile_size * 0.62)
    try:
        font = ImageFont.truetype(FONT_BOLD, font_size)
    except Exception:
        font = ImageFont.load_default()

    tiles = [
        (0, 0, 'L'),
        (1, 0, 'E'),
        (0, 1, 'X'),
        (1, 1, '')
    ]

    for col, row, letter in tiles:
        tx1 = start_x + col * (tile_size + gap)
        ty1 = start_y + row * (tile_size + gap)
        tx2 = tx1 + tile_size
        ty2 = ty1 + tile_size

        if letter:
            # Create a separate tile mask
            tile_mask = Image.new("RGBA", (int(tile_size), int(tile_size)), (0, 0, 0, 0))
            t_draw = ImageDraw.Draw(tile_mask)
            t_draw.rounded_rectangle([0, 0, int(tile_size), int(tile_size)], radius=tile_radius, fill=(255, 255, 255, 255))
            # Cut out letter using transparent fill
            bbox = t_draw.textbbox((0, 0), letter, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            lx = (tile_size - tw) / 2.0 - bbox[0]
            ly = (tile_size - th) / 2.0 - bbox[1]
            t_draw.text((lx, ly), letter, font=font, fill=(0, 0, 0, 0))
            img.paste(tile_mask, (int(tx1), int(ty1)), tile_mask)
        else:
            draw.rounded_rectangle(
                [tx1, ty1, tx2, ty2],
                radius=tile_radius,
                outline=(255, 255, 255, 120),
                width=border_w
            )

    final_img = img.resize((432, 432), Image.Resampling.LANCZOS)
    out_path = os.path.join(ASSETS_DIR, "android-icon-monochrome.png")
    final_img.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({final_img.size})")

def generate_splash_icon():
    """Generate 1024x1024 splash-icon.png with emblem and typography."""
    scale = 2
    size = 1024 * scale
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center_x = size // 2
    center_y = int(size * 0.42)
    card_size = int(360 * scale)
    draw_lex_emblem(draw, center_x, center_y, card_size, scale=scale, with_shadow=False)

    # Wordmark
    wordmark = "L E X O R A"
    font_size = int(48 * scale)
    try:
        font = ImageFont.truetype(FONT_BOLD, font_size)
    except Exception:
        font = ImageFont.load_default()

    text_y = center_y + (card_size // 2) + int(56 * scale)
    bbox = draw.textbbox((0, 0), wordmark, font=font)
    tw = bbox[2] - bbox[0]
    tx = center_x - (tw / 2.0) - bbox[0]
    draw.text((tx, text_y), wordmark, font=font, fill=COLOR_TEXT)

    # Subtitle: DAILY WORD PUZZLE
    sub_size = int(16 * scale)
    try:
        sub_font = ImageFont.truetype(FONT_REG, sub_size)
        sub_text = "DAILY WORD PUZZLE"
        sbbox = draw.textbbox((0, 0), sub_text, font=sub_font)
        sw = sbbox[2] - sbbox[0]
        sx = center_x - (sw / 2.0) - sbbox[0]
        sy = text_y + font_size + int(14 * scale)
        draw.text((sx, sy), sub_text, font=sub_font, fill=COLOR_MUTED)
    except Exception:
        pass

    final_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    out_path = os.path.join(ASSETS_DIR, "splash-icon.png")
    final_img.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({final_img.size})")

def generate_favicon():
    """Generate 48x48 favicon.png."""
    scale = 4
    size = 48 * scale
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    card_size = int(size * 0.88)
    draw_lex_emblem(draw, center, center, card_size, scale=scale, with_shadow=False)

    final_img = img.resize((48, 48), Image.Resampling.LANCZOS)
    out_path = os.path.join(ASSETS_DIR, "favicon.png")
    final_img.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({final_img.size})")

def generate_notification_icon():
    """
    Generate 96x96 notification-icon.png.
    Strictly follows Android Notification Small Icon requirements:
    Pure white silhouette on transparent background with crisp edges.
    """
    scale = 4
    size = 96 * scale
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    grid_size = int(size * 0.76)
    half_grid = grid_size / 2.0
    gx1 = center - half_grid
    gy1 = center - half_grid

    gap = grid_size * 0.10
    tile_size = (grid_size - gap) / 2.0
    tile_radius = int(tile_size * 0.22)
    border_w = max(1, int(3 * scale))

    font_size = int(tile_size * 0.65)
    try:
        font = ImageFont.truetype(FONT_BOLD, font_size)
    except Exception:
        font = ImageFont.load_default()

    tiles = [
        (0, 0, 'L'),
        (1, 0, 'E'),
        (0, 1, 'X'),
        (1, 1, '')
    ]

    for col, row, letter in tiles:
        tx1 = gx1 + col * (tile_size + gap)
        ty1 = gy1 + row * (tile_size + gap)
        tx2 = tx1 + tile_size
        ty2 = ty1 + tile_size

        if letter:
            tile_mask = Image.new("RGBA", (int(tile_size), int(tile_size)), (0, 0, 0, 0))
            t_draw = ImageDraw.Draw(tile_mask)
            t_draw.rounded_rectangle([0, 0, int(tile_size), int(tile_size)], radius=tile_radius, fill=(255, 255, 255, 255))
            bbox = t_draw.textbbox((0, 0), letter, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            lx = (tile_size - tw) / 2.0 - bbox[0]
            ly = (tile_size - th) / 2.0 - bbox[1]
            t_draw.text((lx, ly), letter, font=font, fill=(0, 0, 0, 0))
            img.paste(tile_mask, (int(tx1), int(ty1)), tile_mask)
        else:
            draw.rounded_rectangle(
                [tx1, ty1, tx2, ty2],
                radius=tile_radius,
                outline=(255, 255, 255, 255),
                width=border_w
            )

    final_img = img.resize((96, 96), Image.Resampling.LANCZOS)
    # Ensure all pixels have RGB strictly (255, 255, 255), carrying shape purely in alpha channel
    white_rgb = Image.new("RGB", (96, 96), (255, 255, 255))
    final_img = Image.merge("RGBA", (*white_rgb.split(), final_img.split()[3]))
    out_path = os.path.join(ASSETS_DIR, "notification-icon.png")
    final_img.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({final_img.size})")

if __name__ == "__main__":
    generate_app_icon()
    generate_android_foreground()
    generate_android_background()
    generate_android_monochrome()
    generate_splash_icon()
    generate_favicon()
    generate_notification_icon()
    print("All release assets successfully generated!")
