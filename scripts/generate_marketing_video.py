import os
import sys
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# --- CONFIGURATION ---
WIDTH = 1080
HEIGHT = 1920
FPS = 30
DURATION = 28.0
TOTAL_FRAMES = int(FPS * DURATION) # 840 frames

COLOR_BG = (26, 16, 10)         # #1A100A Deep Espresso
COLOR_SURFACE = (41, 32, 25)    # #292019 Dark Surface
COLOR_BORDER = (69, 55, 46)     # #45372E Refined Border
COLOR_CREAM = (255, 248, 240)   # #FFF8F0 Cream Text
COLOR_MUTED = (184, 170, 160)   # #B8AAA0 Muted Sand
COLOR_ORANGE = (255, 122, 0)    # #FF7A00 Burnt Orange Accent
COLOR_CORRECT = (83, 141, 78)   # #538D4E Forest Green
COLOR_CORRECT_BDR = (59, 107, 55)
COLOR_PRESENT = (181, 159, 59)  # #B59F3B Warm Gold
COLOR_PRESENT_BDR = (140, 119, 38)
COLOR_ABSENT = (73, 65, 59)     # #49413B Dark Slate
COLOR_ABSENT_BDR = (56, 45, 36)

# --- FONTS ---
FONT_SERIF_BOLD = "C:/Windows/Fonts/georgiab.ttf"
FONT_SERIF_REG = "C:/Windows/Fonts/georgia.ttf"
FONT_SANS_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SANS_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_SANS_SBOLD = "C:/Windows/Fonts/segoeuisb.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

# --- EASING HELPERS ---
def ease_in_out(t):
    return t * t * (3 - 2 * t)

def ease_out_cubic(t):
    return 1 - (1 - t) ** 3

def ease_in_cubic(t):
    return t ** 3

def clamp(v, min_v=0.0, max_v=1.0):
    return max(min_v, min(max_v, v))

# --- DRAWING UTILITIES ---
def create_radial_glow(width, height, cx, cy, radius, color, intensity=0.4):
    """Creates a smooth radial glow overlay."""
    glow = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    steps = 14
    r_step = radius / steps
    for i in range(steps, 0, -1):
        cur_r = i * r_step
        cur_alpha = int(255 * intensity * ((steps - i + 1) / steps)**1.8)
        draw.ellipse([cx - cur_r, cy - cur_r, cx + cur_r, cy + cur_r],
                     fill=(color[0], color[1], color[2], cur_alpha))
    return glow.filter(ImageFilter.GaussianBlur(radius=radius * 0.15))

def render_device_frame(screen_img, width=640, height=1385, radius=42):
    """Wraps an authentic screenshot into an ultra-clean titanium smartphone frame."""
    bezel_w = 12
    top_bezel = 18
    total_w = width + bezel_w * 2
    total_h = height + bezel_w + top_bezel

    device = Image.new('RGBA', (total_w + 80, total_h + 80), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(device)

    # Realistic ambient drop shadow
    shadow_box = [40, 48, 40 + total_w, 48 + total_h]
    d_draw.rounded_rectangle(shadow_box, radius=radius + 6, fill=(10, 6, 3, 150))
    device = device.filter(ImageFilter.GaussianBlur(radius=16))
    d_draw = ImageDraw.Draw(device)

    # Outer titanium / dark bronze frame
    outer_box = [40, 40, 40 + total_w, 40 + total_h]
    d_draw.rounded_rectangle(outer_box, radius=radius + 4, fill=(48, 37, 28, 255), outline=(78, 60, 46, 255), width=2)
    
    # Inner bezel
    inner_bezel_box = [40 + 2, 40 + 2, 40 + total_w - 2, 40 + total_h - 2]
    d_draw.rounded_rectangle(inner_bezel_box, radius=radius + 2, outline=(28, 18, 12, 255), width=bezel_w - 2)

    # Screen placement with corner mask (unobstructed full view)
    screen_resized = screen_img.resize((width, height), Image.Resampling.LANCZOS).convert('RGBA')
    mask = Image.new('L', (width, height), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([0, 0, width, height], radius=radius - 6, fill=255)
    
    device.paste(screen_resized, (40 + bezel_w, 40 + top_bezel), mask)

    # Micro speaker slit in top bezel ABOVE the screen (leaves app header 100% visible)
    spk_w, spk_h = 70, 4
    spk_x = 40 + (total_w - spk_w) // 2
    spk_y = 40 + 7
    d_draw.rounded_rectangle([spk_x, spk_y, spk_x + spk_w, spk_y + spk_h],
                             radius=2, fill=(16, 10, 6, 255), outline=(60, 45, 32, 200), width=1)
    
    return device

# --- SCREEN GENERATION HELPERS ---
def build_gameplay_states():
    """Builds the exact pixel-perfect intermediate gameplay screens."""
    base_clean = Image.open('assets/screenshots/gameplay.png').convert('RGBA')
    base_played = Image.open('assets/screenshots/played.png').convert('RGBA')
    base_stats = Image.open('assets/screenshots/stats.png').convert('RGBA')

    font_tile = get_font(FONT_SANS_BOLD, 62)

    # Coordinates in 780x1688 screenshot
    tile_w, tile_h = 112, 112
    xs = [86, 210, 334, 458, 582]
    r1_y = 224
    r2_y = 350
    r3_y = 476

    def draw_tile(draw_ctx, x, y, char, bg, border, scale_y=1.0):
        eff_h = int(tile_h * scale_y)
        if eff_h < 2:
            return
        eff_y = y + (tile_h - eff_h) // 2
        draw_ctx.rounded_rectangle([x, eff_y, x + tile_w, eff_y + eff_h], radius=8, fill=bg, outline=border, width=3)
        if char and scale_y > 0.3:
            bbox = font_tile.getbbox(char)
            tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
            tx = x + (tile_w - tw) // 2 - bbox[0]
            ty = eff_y + (eff_h - th) // 2 - bbox[1]
            draw_ctx.text((tx, ty), char, font=font_tile, fill=COLOR_CREAM)

    # Typing states for Row 1
    typing_screens = []
    letters_r1 = ['C', 'R', 'A', 'N', 'E']
    for count in range(1, 6):
        sc = base_clean.copy()
        draw = ImageDraw.Draw(sc)
        for i in range(count):
            draw_tile(draw, xs[i], r1_y, letters_r1[i], (26, 16, 10), (140, 119, 38), scale_y=1.0)
        typing_screens.append(sc)

    # Row 2 Evaluated: S T E A M
    sc_row2 = base_played.copy()
    draw_r2 = ImageDraw.Draw(sc_row2)
    r2_chars = ['S', 'T', 'E', 'A', 'M']
    r2_colors = [
        (COLOR_ABSENT, COLOR_ABSENT_BDR),
        (COLOR_ABSENT, COLOR_ABSENT_BDR),
        (COLOR_PRESENT, COLOR_PRESENT_BDR),
        (COLOR_PRESENT, COLOR_PRESENT_BDR),
        (COLOR_ABSENT, COLOR_ABSENT_BDR)
    ]
    for x, c, (bg, bdr) in zip(xs, r2_chars, r2_colors):
        draw_tile(draw_r2, x, r2_y, c, bg, bdr)

    # Row 3 Winning: A S H E N (All Green)
    sc_won = sc_row2.copy()
    draw_w = ImageDraw.Draw(sc_won)
    r3_chars = ['A', 'S', 'H', 'E', 'N']
    for x, c in zip(xs, r3_chars):
        draw_tile(draw_w, x, r3_y, c, COLOR_CORRECT, COLOR_CORRECT_BDR)

    return {
        'clean': base_clean,
        'typing': typing_screens,
        'r1_evaluated': base_played,
        'r2_evaluated': sc_row2,
        'won': sc_won,
        'stats': base_stats,
        'draw_tile_fn': draw_tile,
        'xs': xs,
        'r1_y': r1_y,
        'r2_y': r2_y,
        'r3_y': r3_y
    }

# --- MASTER FRAME COMPOSITOR ---
class MarketingVideoRenderer:
    def __init__(self, include_text=True):
        self.include_text = include_text
        self.screens = build_gameplay_states()
        self.icon = Image.open('assets/icon.png').convert('RGBA')

        # Cache pre-rendered device frames
        print("Pre-rendering device frames...")
        self.device_clean = render_device_frame(self.screens['clean'])
        self.device_played = render_device_frame(self.screens['r1_evaluated'])
        self.device_r2 = render_device_frame(self.screens['r2_evaluated'])
        self.device_won = render_device_frame(self.screens['won'])
        self.device_stats = render_device_frame(self.screens['stats'])

        # Pre-render typing devices
        self.devices_typing = [render_device_frame(sc) for sc in self.screens['typing']]

        # Font instances
        self.f_hero = get_font(FONT_SERIF_BOLD, 74)
        self.f_title = get_font(FONT_SANS_BOLD, 48)
        self.f_sub = get_font(FONT_SANS_REG, 26)
        self.f_eyebrow = get_font(FONT_SANS_SBOLD, 22)
        self.f_wordmark = get_font(FONT_SANS_BOLD, 64)
        self.f_cta = get_font(FONT_SANS_BOLD, 28)
        self.f_badge = get_font(FONT_SANS_REG, 22)

    def draw_text_centered(self, draw, text, y, font, color, tracking=0):
        bbox = font.getbbox(text)
        tw = bbox[2] - bbox[0] + len(text) * tracking
        start_x = (WIDTH - tw) // 2
        if tracking == 0:
            draw.text(((WIDTH - (bbox[2] - bbox[0])) // 2, y), text, font=font, fill=color)
        else:
            cur_x = start_x
            for ch in text:
                draw.text((cur_x, y), ch, font=font, fill=color)
                ch_w = font.getbbox(ch)[2] - font.getbbox(ch)[0]
                cur_x += ch_w + tracking

    def draw_wordmark(self, draw, cx, cy, font, scale=1.0, alpha=255):
        """Draws the signature LEXORA wordmark with glowing burnt-orange O."""
        tracking = int(14 * scale)

        col_white = (COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2], alpha)
        col_orange = (COLOR_ORANGE[0], COLOR_ORANGE[1], COLOR_ORANGE[2], alpha)

        full_chars = ["L", "E", "X", "O", "R", "A"]
        widths = [font.getbbox(c)[2] - font.getbbox(c)[0] for c in full_chars]
        total_w = sum(widths) + (len(full_chars) - 1) * tracking

        cur_x = cx - total_w // 2
        for i, ch in enumerate(full_chars):
            color = col_orange if ch == "O" else col_white
            draw.text((cur_x, cy), ch, font=font, fill=color)
            cur_x += widths[i] + tracking

    def render_frame(self, t):
        """Renders 1 frame at timestamp t (0.0s to 28.0s)."""
        frame = Image.new('RGB', (WIDTH, HEIGHT), COLOR_BG)
        draw = ImageDraw.Draw(frame, 'RGBA')

        # Ambient background warm light breathing
        pulse = 0.22 + 0.08 * math.sin(t * 1.5)
        glow = create_radial_glow(WIDTH, HEIGHT, WIDTH // 2, HEIGHT // 2, 540, COLOR_ORANGE, intensity=pulse)
        frame.paste(glow, (0, 0), glow)

        # ========================================================
        # SCENE 1: THE MYSTERY (0.0s - 4.5s)
        # ========================================================
        if t < 4.5:
            # Standalone 5 floating tiles materializing
            tiles_y = 960
            t_size = 120
            t_gap = 20
            total_w = 5 * t_size + 4 * t_gap
            start_x = (WIDTH - total_w) // 2

            # Camera slow push-in zoom
            zoom = 1.0 + 0.04 * (t / 4.5)

            for i in range(5):
                t_delay = 0.3 + i * 0.22
                if t >= t_delay:
                    prog = clamp((t - t_delay) / 0.45)
                    scale = 0.85 + 0.15 * ease_out_cubic(prog)
                    alpha = int(255 * ease_out_cubic(prog))
                    
                    eff_s = int(t_size * scale * zoom)
                    cur_cx = start_x + i * (t_size + t_gap) + t_size // 2
                    cur_cy = tiles_y
                    
                    x0 = cur_cx - eff_s // 2
                    y0 = cur_cy - eff_s // 2
                    draw.rounded_rectangle([x0, y0, x0 + eff_s, y0 + eff_s],
                                           radius=int(14 * scale),
                                           fill=(COLOR_SURFACE[0], COLOR_SURFACE[1], COLOR_SURFACE[2], alpha),
                                           outline=(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2], alpha),
                                           width=3)

                    # Mystery glowing '?' in center tile (index 2)
                    if i == 2 and t >= 1.8:
                        q_prog = clamp((t - 1.8) / 0.5)
                        q_alpha = int(255 * ease_out_cubic(q_prog))
                        f_q = get_font(FONT_SERIF_BOLD, int(72 * scale * zoom))
                        q_glow = 0.8 + 0.2 * math.sin((t - 1.8) * 4)
                        q_col = (COLOR_ORANGE[0], COLOR_ORANGE[1], COLOR_ORANGE[2], int(q_alpha * q_glow))
                        bbox = f_q.getbbox("?")
                        qw, qh = bbox[2] - bbox[0], bbox[3] - bbox[1]
                        draw.text((cur_cx - qw // 2, cur_cy - qh // 2 - bbox[1]), "?", font=f_q, fill=q_col)

            # Scene 1 Text
            if self.include_text and t >= 0.8:
                fade = clamp((t - 0.8) / 0.6)
                if t > 4.0:
                    fade *= clamp((4.5 - t) / 0.5)
                alpha = int(255 * ease_out_cubic(fade))
                
                self.draw_text_centered(draw, "A   D A I L Y   W O R D   P U Z Z L E", 680,
                                        self.f_eyebrow, (COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2], alpha), tracking=6)
                self.draw_text_centered(draw, "Every day begins with a mystery.", 745,
                                        self.f_title, (COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2], alpha))

        # ========================================================
        # SCENE 2: MEET LEXORA (4.5s - 8.5s)
        # ========================================================
        elif t < 8.5:
            # Wordmark entrance at top
            wm_fade = clamp((t - 4.5) / 0.6)
            wm_alpha = int(255 * ease_out_cubic(wm_fade))
            self.draw_wordmark(draw, WIDTH // 2, 280, self.f_wordmark, alpha=wm_alpha)

            # Device entrance gliding from bottom (lands at Y=410, well below titles)
            dev_prog = clamp((t - 5.4) / 1.1)
            e_dev = ease_out_cubic(dev_prog)
            dev_y = int(1700 - 1290 * e_dev) # Rises to Y ≈ 410

            dev_x = (WIDTH - self.device_clean.width) // 2
            frame.paste(self.device_clean, (dev_x, dev_y), self.device_clean)

            # Scene 2 Text
            if self.include_text:
                t2_fade = clamp((t - 4.8) / 0.5)
                if t > 8.0:
                    t2_fade *= clamp((8.5 - t) / 0.5)
                alpha = int(255 * ease_out_cubic(t2_fade))
                self.draw_text_centered(draw, "Meet Lexora.", 150,
                                        self.f_title, (COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2], alpha))
                self.draw_text_centered(draw, "A little mystery. Five letters. One word.", 215,
                                        self.f_sub, (COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2], alpha))

        # ========================================================
        # SCENE 3: THE EXPERIENCE (8.5s - 15.5s)
        # ========================================================
        elif t < 15.5:
            # Dynamic camera zoom into the interactive gameplay
            if t < 10.0:
                z_prog = clamp((t - 8.5) / 1.2)
                cam_scale = 1.0 + 0.12 * ease_out_cubic(z_prog)
                cam_y = int(1120 - 90 * ease_out_cubic(z_prog))
            elif t < 13.5:
                cam_scale = 1.12
                cam_y = 1030
            else:
                z_prog = clamp((t - 13.5) / 1.2)
                cam_scale = 1.12 - 0.12 * ease_out_cubic(z_prog)
                cam_y = int(1030 + 90 * ease_out_cubic(z_prog))

            # Select device state based on typing / reveal
            if t < 9.1:
                cur_dev = self.device_clean
            elif t < 9.5:
                cur_dev = self.devices_typing[0] # C
            elif t < 9.9:
                cur_dev = self.devices_typing[1] # CR
            elif t < 10.3:
                cur_dev = self.devices_typing[2] # CRA
            elif t < 10.7:
                cur_dev = self.devices_typing[3] # CRAN
            elif t < 11.6:
                cur_dev = self.devices_typing[4] # CRANE
            else:
                cur_dev = self.device_played     # Evaluated CRANE

            dw = int(cur_dev.width * cam_scale)
            dh = int(cur_dev.height * cam_scale)
            scaled_dev = cur_dev.resize((dw, dh), Image.Resampling.LANCZOS)
            dx = (WIDTH - dw) // 2
            dy = cam_y - dh // 2

            frame.paste(scaled_dev, (dx, dy), scaled_dev)

            # Scene 3 Text (Comfortably in top canvas)
            if self.include_text:
                t3_fade = clamp((t - 9.0) / 0.6)
                if t > 14.8:
                    t3_fade *= clamp((15.5 - t) / 0.5)
                alpha = int(255 * ease_out_cubic(t3_fade))
                self.draw_text_centered(draw, "Pure deduction. Zero distractions.", 120,
                                        self.f_title, (COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2], alpha))
                self.draw_text_centered(draw, "Thoughtfully designed for true word lovers.", 185,
                                        self.f_sub, (COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2], alpha))

        # ========================================================
        # SCENE 4: THE REVEAL & VICTORY (15.5s - 21.5s)
        # ========================================================
        elif t < 21.5:
            cam_y = 1080
            cam_scale = 1.04

            # 15.5 - 17.5: Row 2 evaluated (S T E A M)
            # 17.5 - 19.0: Green reveal of A S H E N
            # 19.0+: All green won state with subtle celebration bounce
            if t < 17.5:
                cur_dev = self.device_r2
            else:
                cur_dev = self.device_won

            dw = int(cur_dev.width * cam_scale)
            dh = int(cur_dev.height * cam_scale)
            scaled_dev = cur_dev.resize((dw, dh), Image.Resampling.LANCZOS)
            dx = (WIDTH - dw) // 2
            dy = cam_y - dh // 2

            # Subtle victory bounce wave after 18.6s
            if t >= 18.6:
                bounce_prog = t - 18.6
                dy += int(-12 * math.sin(bounce_prog * 6) * math.exp(-bounce_prog * 0.8))

                # Blooming victory emerald glow
                v_glow = create_radial_glow(WIDTH, HEIGHT, WIDTH // 2, dy + int(dh * 0.35), 440, COLOR_CORRECT, intensity=0.35)
                frame.paste(v_glow, (0, 0), v_glow)

            frame.paste(scaled_dev, (dx, dy), scaled_dev)

            # Scene 4 Text
            if self.include_text:
                t4_fade = clamp((t - 15.8) / 0.6)
                if t > 20.8:
                    t4_fade *= clamp((21.5 - t) / 0.5)
                alpha = int(255 * ease_out_cubic(t4_fade))
                self.draw_text_centered(draw, "Five letters. One word.", 120,
                                        self.f_title, (COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2], alpha))
                self.draw_text_centered(draw, "Solved in 3. Pure satisfaction.", 185,
                                        self.f_sub, (COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2], alpha))

        # ========================================================
        # SCENE 5: THE DAILY RITUAL (21.5s - 25.5s)
        # ========================================================
        elif t < 25.5:
            # Wide shot easing backward showing Stats Modal
            ease_prog = clamp((t - 21.5) / 1.0)
            cam_scale = 1.04 - 0.08 * ease_out_cubic(ease_prog) # 0.96 scale
            cam_y = int(1080 + 40 * ease_out_cubic(ease_prog))

            dw = int(self.device_stats.width * cam_scale)
            dh = int(self.device_stats.height * cam_scale)
            scaled_dev = self.device_stats.resize((dw, dh), Image.Resampling.LANCZOS)
            dx = (WIDTH - dw) // 2
            dy = cam_y - dh // 2

            frame.paste(scaled_dev, (dx, dy), scaled_dev)

            # Scene 5 Text
            if self.include_text:
                t5_fade = clamp((t - 21.8) / 0.6)
                if t > 24.8:
                    t5_fade *= clamp((25.5 - t) / 0.5)
                alpha = int(255 * ease_out_cubic(t5_fade))
                self.draw_text_centered(draw, "Your daily word ritual.", 120,
                                        self.f_title, (COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2], alpha))
                self.draw_text_centered(draw, "00:00 UTC • Synchronized worldwide", 185,
                                        self.f_sub, (COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2], alpha))

        # ========================================================
        # SCENE 6: BRAND END CARD (25.5s - 28.0s)
        # ========================================================
        else:
            # End Card Lockup
            ec_fade = clamp((t - 25.5) / 0.6)
            if t > 27.5:
                ec_fade *= clamp((28.0 - t) / 0.5)
            alpha = int(255 * ease_out_cubic(ec_fade))

            # 1. App Icon
            icon_s = 180
            icon_resized = self.icon.resize((icon_s, icon_s), Image.Resampling.LANCZOS)
            icon_mask = Image.new('L', (icon_s, icon_s), 0)
            ImageDraw.Draw(icon_mask).rounded_rectangle([0, 0, icon_s, icon_s], radius=40, fill=255)
            
            icon_x = (WIDTH - icon_s) // 2
            icon_y = 620
            # Drop shadow
            draw.rounded_rectangle([icon_x, icon_y + 8, icon_x + icon_s, icon_y + icon_s + 8],
                                   radius=42, fill=(10, 6, 3, int(150 * (alpha / 255))))
            frame.paste(icon_resized, (icon_x, icon_y), icon_mask)

            # 2. Wordmark
            self.draw_wordmark(draw, WIDTH // 2, 850, self.f_hero, alpha=alpha)

            # 3. Tagline
            self.draw_text_centered(draw, "Think it. Find it. Lexora.", 960,
                                    self.f_title, (COLOR_CREAM[0], COLOR_CREAM[1], COLOR_CREAM[2], alpha))

            # 4. Call to Action Button: "Play today."
            btn_w, btn_h = 340, 72
            btn_x = (WIDTH - btn_w) // 2
            btn_y = 1080
            draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
                                   radius=36, fill=(COLOR_ORANGE[0], COLOR_ORANGE[1], COLOR_ORANGE[2], alpha))
            
            bbox_cta = self.f_cta.getbbox("Play today.")
            cw, ch = bbox_cta[2] - bbox_cta[0], bbox_cta[3] - bbox_cta[1]
            draw.text((btn_x + (btn_w - cw) // 2, btn_y + (btn_h - ch) // 2 - bbox_cta[1]),
                      "Play today.", font=self.f_cta, fill=(COLOR_BG[0], COLOR_BG[1], COLOR_BG[2], alpha))

            # 5. Trust badge
            self.draw_text_centered(draw, "100% Offline   •   No Ads   •   No Accounts", 1210,
                                    self.f_badge, (COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2], alpha), tracking=2)

        return frame

# --- RENDER TO MP4 ---
def render_video(output_mp4, include_text=True, audio_wav="scripts/lexora_soundtrack.wav"):
    renderer = MarketingVideoRenderer(include_text=include_text)

    cmd = [
        'ffmpeg', '-y',
        '-loglevel', 'error',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{WIDTH}x{HEIGHT}',
        '-pix_fmt', 'rgb24',
        '-r', str(FPS),
        '-i', '-',
        '-i', audio_wav,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-movflags', '+faststart',
        output_mp4
    ]

    print(f"\n==================================================")
    print(f"Rendering: {output_mp4} (include_text={include_text})")
    print(f"Total frames: {TOTAL_FRAMES} at {FPS}fps ({DURATION}s)")
    print(f"==================================================")

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / FPS
        frame = renderer.render_frame(t)
        proc.stdin.write(frame.tobytes())

        if (frame_idx + 1) % 90 == 0 or frame_idx == TOTAL_FRAMES - 1:
            pct = ((frame_idx + 1) / TOTAL_FRAMES) * 100
            sys.stdout.write(f"\rRendered {frame_idx + 1}/{TOTAL_FRAMES} frames ({pct:.1f}%) | Time: {t:.2f}s")
            sys.stdout.flush()

    proc.stdin.close()
    proc.wait()

    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg rendering failed with code {proc.returncode}")

    print(f"\nSuccessfully generated: {output_mp4} ({os.path.getsize(output_mp4) / 1024 / 1024:.2f} MB)")

if __name__ == '__main__':
    # 1. Main marketing video with text and audio
    render_video("scripts/lexora_marketing_reel.mp4", include_text=True)
    # 2. Textless version for flexible social editing
    render_video("scripts/lexora_marketing_reel_notext.mp4", include_text=False)
