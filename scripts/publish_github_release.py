import subprocess
import urllib.request
import urllib.parse
import json
import os
import sys

def get_github_token():
    p = subprocess.Popen(
        ['git', 'credential', 'fill'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, _ = p.communicate("protocol=https\nhost=github.com\n")
    for line in stdout.splitlines():
        if line.startswith('password='):
            return line[len('password='):]
    raise RuntimeError("Could not retrieve GitHub token from git credentials")

def main():
    token = get_github_token()
    repo = "Nairy1729/Lexora"
    tag = "v1.0.0"
    
    release_title = "Lexora v1.0.0 — Official Android Release"
    release_body = """## ✨ Lexora v1.0.0 — Premium Offline-First Word Puzzle

Welcome to the initial official release of **Lexora**! A refined, minimalist daily word puzzle crafted with React Native, Expo SDK 52, and TypeScript.

### 🚀 What's Inside

- **📅 Synchronized Daily Puzzles**: One deterministic challenge globally every day at 00:00 UTC, backed by 2,311 non-repeating curated solutions (6.3+ years).
- **🎯 Independent Practice Mode**: Unlimited standalone puzzle games completely isolated from your daily streak and career stats.
- **🎨 Premium Dark-Glass Visual Identity**: Restrained warm espresso (`#1A100A`), ambient glow, and amber accents (`#FF7A00`) with WCAG AAA contrast.
- **⌨️ Ergonomic Keyboard Layout**: 3-row QWERTY with Backspace on Row 3 and a centered, wide `• ENTER` button below.
- **🔒 100% Offline & Private**: Zero analytics, zero telemetry, zero ads, no user accounts required. Full 12,947-word vocabulary bundled locally.
- **📊 Career Statistics & Distribution**: Local career tracking, win percentages, current/max streaks, and guess distribution histograms.
- **🔔 Smart Daytime Reminders**: Optional 4-hour local notification scheduler (9 AM, 1 PM, 5 PM, 9 PM) auto-cancelled upon puzzle completion.

---

### 📦 Asset Details

- **File**: `Lexora-v1.0.0.apk`
- **Size**: 36.15 MB (37,911,243 bytes)
- **Architectures**: `arm64-v8a`, `armeabi-v7a`
- **SHA256**: `C2B4E24247029AE1FE1D54C76C3BA01E3E5EEB7E3BC7F9D517ACC4731E841CDD`
"""

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Lexora-Release-Script"
    }

    # 1. Check if release already exists
    print(f"Checking existing releases for {repo}...")
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}/releases/tags/{tag}", headers=headers)
    release_data = None
    try:
        with urllib.request.urlopen(req) as resp:
            release_data = json.loads(resp.read().decode('utf-8'))
            print(f"Found existing release ID {release_data['id']}.")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("Release does not exist yet. Creating new release...")
        else:
            raise

    # 2. Create release if not found
    if not release_data:
        create_payload = json.dumps({
            "tag_name": tag,
            "target_commitish": "main",
            "name": release_title,
            "body": release_body,
            "draft": False,
            "prerelease": False
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"https://api.github.com/repos/{repo}/releases",
            data=create_payload,
            headers={**headers, "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            release_data = json.loads(resp.read().decode('utf-8'))
            print(f"Created release ID {release_data['id']}.")

    release_id = release_data['id']
    html_url = release_data['html_url']
    upload_url_template = release_data['upload_url'] # contains '{?name,label}'

    # 3. Check existing assets
    apk_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "builds", "lexora-v1.0.0.apk")
    asset_name = "Lexora-v1.0.0.apk"
    
    for asset in release_data.get('assets', []):
        if asset['name'] == asset_name:
            print(f"Asset {asset_name} already exists (ID: {asset['id']}). Deleting old asset to overwrite...")
            del_req = urllib.request.Request(
                f"https://api.github.com/repos/{repo}/releases/assets/{asset['id']}",
                headers=headers,
                method='DELETE'
            )
            with urllib.request.urlopen(del_req) as del_resp:
                print("Old asset deleted.")

    # 4. Upload APK asset
    upload_url = upload_url_template.split('{')[0] + f"?name={asset_name}"
    print(f"Uploading {apk_path} ({os.path.getsize(apk_path)} bytes) to {upload_url}...")
    
    with open(apk_path, 'rb') as f:
        apk_bytes = f.read()

    upload_req = urllib.request.Request(
        upload_url,
        data=apk_bytes,
        headers={
            **headers,
            "Content-Type": "application/vnd.android.package-archive"
        }
    )
    with urllib.request.urlopen(upload_req) as upload_resp:
        asset_info = json.loads(upload_resp.read().decode('utf-8'))
        print(f"Successfully uploaded {asset_name}!")
        print(f"Download URL: {asset_info['browser_download_url']}")
        print(f"Release Page: {html_url}")

if __name__ == '__main__':
    main()
