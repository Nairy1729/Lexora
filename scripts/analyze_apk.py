import sys
import zipfile
import os
from collections import defaultdict

target_name = sys.argv[1] if len(sys.argv) > 1 else "lexora-release-optimized.apk"
APK_PATH = os.path.join(os.path.dirname(__file__), "..", "builds", target_name)
APK_PATH = os.path.abspath(APK_PATH)

def analyze():
    print(f"Analyzing APK: {APK_PATH}")
    if not os.path.exists(APK_PATH):
        print("APK does not exist!")
        return

    total_size = os.path.getsize(APK_PATH)
    print(f"Total APK File Size: {total_size:,} bytes ({total_size / (1024*1024):.2f} MB)")

    with zipfile.ZipFile(APK_PATH, 'r') as z:
        infolist = z.infolist()
        total_uncompressed = sum(info.file_size for info in infolist)
        total_compressed = sum(info.compress_size for info in infolist)
        print(f"Total Uncompressed (Installed on Device): {total_uncompressed:,} bytes ({total_uncompressed / (1024*1024):.2f} MB)")
        print(f"Total Compressed in Zip: {total_compressed:,} bytes ({total_compressed / (1024*1024):.2f} MB)")
        print(f"Total File Count: {len(infolist):,}\n")

        categories = defaultdict(lambda: {"count": 0, "uncompressed": 0, "compressed": 0})
        lib_by_abi = defaultdict(lambda: {"count": 0, "uncompressed": 0, "compressed": 0, "files": []})
        assets_files = []
        dex_files = []

        for info in infolist:
            fn = info.filename
            if fn.startswith("lib/"):
                parts = fn.split("/")
                abi = parts[1] if len(parts) > 1 else "unknown"
                lib_by_abi[abi]["count"] += 1
                lib_by_abi[abi]["uncompressed"] += info.file_size
                lib_by_abi[abi]["compressed"] += info.compress_size
                lib_by_abi[abi]["files"].append((fn, info.file_size, info.compress_size))
                cat = f"lib/{abi}"
            elif fn.startswith("classes") and fn.endswith(".dex"):
                cat = "dex (bytecode)"
                dex_files.append((fn, info.file_size, info.compress_size))
            elif fn.startswith("assets/"):
                cat = "assets (js/fonts/etc)"
                assets_files.append((fn, info.file_size, info.compress_size))
            elif fn.startswith("res/"):
                cat = "res (drawables/xml)"
            elif fn == "resources.arsc":
                cat = "resources.arsc (compiled table)"
            elif fn.startswith("META-INF/"):
                cat = "META-INF (signing)"
            else:
                cat = "root / other"

            categories[cat]["count"] += 1
            categories[cat]["uncompressed"] += info.file_size
            categories[cat]["compressed"] += info.compress_size

        print("="*70)
        print("1. SUMMARY BREAKDOWN BY CATEGORY")
        print("="*70)
        for cat, data in sorted(categories.items(), key=lambda x: x[1]["compressed"], reverse=True):
            pct = (data["compressed"] / total_size) * 100
            print(f"{cat:<28} | {data['compressed'] / (1024*1024):6.2f} MB ({pct:5.1f}%) | Installed: {data['uncompressed'] / (1024*1024):6.2f} MB | {data['count']:4} files")

        print("\n" + "="*70)
        print("2. NATIVE ARCHITECTURES (MULTI-ABI / UNIVERSAL CHECK)")
        print("="*70)
        total_lib_compressed = sum(d["compressed"] for d in lib_by_abi.values())
        print(f"Total Native Libraries: {total_lib_compressed / (1024*1024):.2f} MB ({total_lib_compressed / total_size * 100:.1f}% of APK!)")
        for abi, data in sorted(lib_by_abi.items(), key=lambda x: x[1]["compressed"], reverse=True):
            pct = (data["compressed"] / total_size) * 100
            print(f"  Architecture: {abi:<12} | {data['compressed'] / (1024*1024):6.2f} MB ({pct:5.1f}%) | Installed: {data['uncompressed'] / (1024*1024):6.2f} MB | {data['count']} .so files")

        # Top 15 largest .so files in arm64-v8a
        if "arm64-v8a" in lib_by_abi:
            print("\n  Top 10 largest .so libraries in arm64-v8a:")
            sorted_so = sorted(lib_by_abi["arm64-v8a"]["files"], key=lambda x: x[2], reverse=True)[:10]
            for fn, u, c in sorted_so:
                name = os.path.basename(fn)
                print(f"    {name:<30} | {c / (1024*1024):5.2f} MB compressed | {u / (1024*1024):5.2f} MB uncompressed")

        print("\n" + "="*70)
        print("3. JAVASCRIPT BUNDLE & HERMES RUNTIME")
        print("="*70)
        for fn, u, c in sorted(assets_files, key=lambda x: x[2], reverse=True):
            if "index.android.bundle" in fn or ".hbc" in fn or "bundle" in fn.lower():
                print(f"  Bundle: {fn} | {c / (1024*1024):.2f} MB compressed ({u / (1024*1024):.2f} MB uncompressed)")
        for fn, u, c in sorted(assets_files, key=lambda x: x[2], reverse=True)[:10]:
            print(f"  Asset: {fn:<35} | {c / 1024:8.1f} KB compressed ({u / 1024:8.1f} KB uncompressed)")

        print("\n" + "="*70)
        print("4. DEX FILES (JAVA / KOTLIN CODE)")
        print("="*70)
        for fn, u, c in dex_files:
            print(f"  {fn:<20} | {c / (1024*1024):.2f} MB compressed ({u / (1024*1024):.2f} MB uncompressed)")

if __name__ == "__main__":
    analyze()
