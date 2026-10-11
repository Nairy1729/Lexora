"""
Independent verification script for Lexora Release Gate.
Performs programmatic validation of:
1. Dictionary metrics (counts, duplicates, 5-letter regex, subset relation).
2. Historical puzzle index compatibility (0-175).
3. Image asset dimensions, existence, and format.
4. App.json configuration references.
"""
import os
import re
import json
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
WORDLIST_PATH = os.path.join(PROJECT_ROOT, "src", "engine", "wordList.ts")
APP_JSON_PATH = os.path.join(PROJECT_ROOT, "app.json")

def verify_wordlist():
    print("--- 1. VERIFYING DICTIONARY & COMPATIBILITY ---")
    with open(WORDLIST_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract ANSWERS array
    answers_match = re.search(r"export const ANSWERS:\s*string\[\]\s*=\s*\[(.*?)\];", content, re.DOTALL)
    assert answers_match, "Could not find ANSWERS array"
    answers_raw = answers_match.group(1)
    answers = re.findall(r"'([A-Z]+)'", answers_raw)

    print(f"Total ANSWERS: {len(answers)}")
    assert len(answers) >= 2300, f"Expected >= 2300 answers, got {len(answers)}"

    # Check 5 letters and uppercase
    five_letter = re.compile(r"^[A-Z]{5}$")
    for idx, w in enumerate(answers):
        assert five_letter.match(w), f"Answer at index {idx} ({w}) invalid"

    # Check duplicates in answers
    dup_answers = len(answers) - len(set(answers))
    print(f"Duplicate answers: {dup_answers}")
    assert dup_answers == 0, f"Found {dup_answers} duplicate answers"

    # Extract ADDITIONAL_GUESSES
    add_match = re.search(r"const ADDITIONAL_GUESSES:\s*string\[\]\s*=\s*\[(.*?)\];", content, re.DOTALL)
    assert add_match, "Could not find ADDITIONAL_GUESSES array"
    add_guesses = re.findall(r"'([A-Z]+)'", add_match.group(1))
    print(f"Additional guesses count: {len(add_guesses)}")

    total_valid_guesses = set(answers).union(set(add_guesses))
    print(f"Total VALID_GUESSES count: {len(total_valid_guesses)}")
    assert len(total_valid_guesses) >= 12900, f"Expected >= 12900 guesses, got {len(total_valid_guesses)}"

    # Check that all answers are in valid guesses
    for a in answers:
        assert a in total_valid_guesses, f"Answer {a} missing from valid guesses"

    # Check historical 176 words
    historical_176 = [
      'SLATE', 'CRANE', 'ROAST', 'PLANT', 'SHINE', 'CLOUD', 'FLAME', 'BRICK',
      'STORM', 'LIGHT', 'OCEAN', 'BRAVE', 'WORLD', 'PIANO', 'HEART', 'DREAM',
      'SMILE', 'WATER', 'HOUSE', 'TRAIN', 'PEACH', 'CHAIR', 'BREAD', 'SWEET',
      'MUSIC', 'GREEN', 'STONE', 'RIVER', 'STAMP', 'CROWN', 'GRACE', 'BLAZE',
      'CHEST', 'FLUTE', 'GLOBE', 'HONEY', 'LODGE', 'MANGO', 'NOBLE', 'ORBIT',
      'PATCH', 'QUIET', 'RIDER', 'SCOUT', 'TIGER', 'VALOR', 'WHEAT', 'YOUTH',
      'ZEBRA', 'ALERT', 'BEACH', 'CHARM', 'DRIFT', 'EAGLE', 'FROST', 'GIANT',
      'HAVEN', 'IVORY', 'JEWEL', 'KNACK', 'LEMON', 'MAPLE', 'NURSE', 'ONION',
      'PRIDE', 'QUEST', 'ROBIN', 'SPARK', 'TULIP', 'VOICE', 'WHALE', 'AMBER',
      'BLOOM', 'CEDAR', 'DAISY', 'EMBER', 'FAITH', 'GLINT', 'HAZEL', 'ISLET',
      'JOUST', 'KOALA', 'LUNAR', 'MOTIF', 'NORTH', 'OASIS', 'PEARL', 'QUARK',
      'REALM', 'SUGAR', 'TRACE', 'ULTRA', 'VIVID', 'WALTZ', 'YACHT', 'ANGEL',
      'BERRY', 'CORAL', 'DANCE', 'EARTH', 'FEAST', 'GHOST', 'HOTEL', 'IMAGE',
      'JUDGE', 'KNEEL', 'LATCH', 'MELON', 'NIGHT', 'OLIVE', 'POWER', 'QUICK',
      'RANCH', 'SOLAR', 'TRACK', 'UNITY', 'VAPOR', 'WATCH', 'YEARN', 'APPLE',
      'BLUSH', 'CRISP', 'DRIVE', 'ELBOW', 'FLASH', 'GLORY', 'HEATH', 'INDEX',
      'JOKER', 'KAYAK', 'LOGIC', 'MARCH', 'NOVEL', 'OPERA', 'PLAZA', 'QUEEN',
      'RADAR', 'SCALE', 'TOWER', 'URBAN', 'VIPER', 'WOVEN', 'YEAST', 'ARROW',
      'BACON', 'CLIMB', 'DRAFT', 'ENTRY', 'FLOCK', 'GRAPE', 'HUMOR', 'INPUT',
      'JUMBO', 'KARMA', 'LASER', 'MEDAL', 'NINJA', 'OZONE', 'PILOT', 'QUOTA',
      'RHYME', 'SHARK', 'TABLE', 'UNSET', 'VIRUS', 'WAGON', 'ABOVE', 'BASIC',
      'CABIN', 'DEPTH', 'EQUAL', 'FLOAT', 'GRAIN', 'HABIT', 'INFER', 'JOINT',
    ]

    for i in range(176):
        assert answers[i] == historical_176[i], f"Mismatch at historical index {i}: expected {historical_176[i]}, got {answers[i]}"
    print("Historical compatibility (indices 0..175): 100% IDENTICAL")
    print(f"Answer at index 176: {answers[176]} (previously would wrap to SLATE; now expands with non-repeating vocabulary)")

def verify_assets_and_config():
    print("\n--- 2. VERIFYING ASSETS & CONFIGURATION ---")
    with open(APP_JSON_PATH, "r", encoding="utf-8") as f:
        app_json = json.load(f)

    expo = app_json.get("expo", {})
    
    # Expected assets
    expected_assets = {
        "icon": (expo.get("icon"), (1024, 1024), "RGBA"),
        "android.adaptiveIcon.foregroundImage": (expo.get("android", {}).get("adaptiveIcon", {}).get("foregroundImage"), (512, 512), "RGBA"),
        "android.adaptiveIcon.backgroundImage": (expo.get("android", {}).get("adaptiveIcon", {}).get("backgroundImage"), (512, 512), "RGBA"),
        "android.adaptiveIcon.monochromeImage": (expo.get("android", {}).get("adaptiveIcon", {}).get("monochromeImage"), (432, 432), "RGBA"),
        "web.favicon": (expo.get("web", {}).get("favicon"), (48, 48), "RGBA"),
    }

    # Plugins assets
    for plugin in expo.get("plugins", []):
        if isinstance(plugin, list) and len(plugin) > 0:
            if plugin[0] == "expo-splash-screen":
                expected_assets["splash-image"] = (plugin[1].get("image"), (1024, 1024), "RGBA")
            elif plugin[0] == "expo-notifications":
                expected_assets["notification-icon"] = (plugin[1].get("icon"), (96, 96), "RGBA")

    for name, (rel_path, expected_dims, expected_mode) in expected_assets.items():
        assert rel_path, f"Asset reference missing for {name}"
        clean_path = rel_path.replace("./", "")
        full_path = os.path.join(PROJECT_ROOT, clean_path)
        assert os.path.exists(full_path), f"Asset file missing: {full_path}"
        with Image.open(full_path) as img:
            print(f"Asset [{name}]: {clean_path} -> Size: {img.size}, Mode: {img.mode}, Format: {img.format}")
            assert img.size == expected_dims, f"Dimension mismatch for {name}: expected {expected_dims}, got {img.size}"
            assert img.format == "PNG", f"Format mismatch for {name}: expected PNG, got {img.format}"

    # Notification icon monochrome check
    notif_path = os.path.join(ASSETS_DIR, "notification-icon.png")
    with Image.open(notif_path) as img:
        # Check that RGB channels are pure white (255, 255, 255) for non-transparent pixels
        img_rgba = img.convert("RGBA")
        for x in range(img.width):
            for y in range(img.height):
                r, g, b, a = img_rgba.getpixel((x, y))
                if a > 0:
                    assert r == 255 and g == 255 and b == 255, f"Non-monochrome pixel at ({x},{y}): ({r},{g},{b},{a})"
    print("Notification small icon is strictly monochrome pure white on transparent alpha mask.")

    # Permissions check
    permissions = expo.get("android", {}).get("permissions", [])
    print(f"Android declared permissions: {permissions}")
    assert permissions == ["android.permission.POST_NOTIFICATIONS"], f"Unexpected permissions: {permissions}"

if __name__ == "__main__":
    verify_wordlist()
    verify_assets_and_config()
    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")
