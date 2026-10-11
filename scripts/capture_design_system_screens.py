import urllib.request
import json
import time
import websocket
import subprocess
import base64

# Start headless Chrome
cmd = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--remote-debugging-port=9223',
    '--remote-allow-origins=*',
    '--disable-gpu',
    '--hide-scrollbars',
    'http://localhost:8089'
]
proc = subprocess.Popen(cmd)
time.sleep(2)

try:
    tabs = json.loads(urllib.request.urlopen('http://localhost:9223/json').read())
    ws_url = [t['webSocketDebuggerUrl'] for t in tabs if t['url'].startswith('http://localhost:8089')][0]
    ws = websocket.create_connection(ws_url)

    # 1. Wait for initial launch screen animation to complete and dissolve (~2.6s)
    time.sleep(2.6)

    # Standard viewport: 390 x 844
    def set_viewport(w, h):
        ws.send(json.dumps({
            'id': 1,
            'method': 'Emulation.setDeviceMetricsOverride',
            'params': {
                'width': w,
                'height': h,
                'deviceScaleFactor': 2,
                'mobile': True,
            }
        }))
        ws.recv()
        time.sleep(0.3)

    def capture(filename):
        ws.send(json.dumps({'id': 2, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
        res = json.loads(ws.recv())
        data = base64.b64decode(res['result']['data'])
        with open(filename, 'wb') as f:
            f.write(data)
        print(f"Captured {filename}")

    # Standard 390x844
    set_viewport(390, 844)
    capture('scripts/design_gameplay_390x844.png')

    # Compact 360x640
    set_viewport(360, 640)
    capture('scripts/design_gameplay_360x640.png')

    # Tall 412x915
    set_viewport(412, 915)
    capture('scripts/design_gameplay_412x915.png')

    # Back to 390x844 for interactions
    set_viewport(390, 844)

    # Type 'CRANE' and submit with Enter
    for letter in ['C', 'R', 'A', 'N', 'E']:
        ws.send(json.dumps({
            'id': 10,
            'method': 'Input.dispatchKeyEvent',
            'params': {'type': 'keyDown', 'key': letter, 'code': f'Key{letter}'}
        }))
        ws.recv()
        time.sleep(0.06)
        ws.send(json.dumps({
            'id': 11,
            'method': 'Input.dispatchKeyEvent',
            'params': {'type': 'keyUp', 'key': letter, 'code': f'Key{letter}'}
        }))
        ws.recv()
        time.sleep(0.06)

    ws.send(json.dumps({
        'id': 12,
        'method': 'Input.dispatchKeyEvent',
        'params': {'type': 'keyDown', 'key': 'Enter', 'code': 'Enter'}
    }))
    ws.recv()
    time.sleep(0.06)
    ws.send(json.dumps({
        'id': 13,
        'method': 'Input.dispatchKeyEvent',
        'params': {'type': 'keyUp', 'key': 'Enter', 'code': 'Enter'}
    }))
    ws.recv()
    time.sleep(1.8) # Wait for tile reveals

    capture('scripts/design_gameplay_played.png')

    # Click Help button via DOM click
    ws.send(json.dumps({
        'id': 20,
        'method': 'Runtime.evaluate',
        'params': {
            'expression': '''
                (function() {
                    const btn = document.querySelector('[aria-label="How to Play"]');
                    if (btn) btn.click();
                })()
            '''
        }
    }))
    ws.recv()
    time.sleep(0.6)
    capture('scripts/design_modal_help.png')

    # Close Help button
    ws.send(json.dumps({
        'id': 21,
        'method': 'Runtime.evaluate',
        'params': {
            'expression': '''
                (function() {
                    const btn = document.querySelector('[aria-label="Close help dialog"]');
                    if (btn) btn.click();
                })()
            '''
        }
    }))
    ws.recv()
    time.sleep(0.5)

    # Click Stats button
    ws.send(json.dumps({
        'id': 22,
        'method': 'Runtime.evaluate',
        'params': {
            'expression': '''
                (function() {
                    const btn = document.querySelector('[aria-label="View Game Statistics"]');
                    if (btn) btn.click();
                })()
            '''
        }
    }))
    ws.recv()
    time.sleep(0.6)
    capture('scripts/design_modal_stats.png')

    # Close Stats button
    ws.send(json.dumps({
        'id': 23,
        'method': 'Runtime.evaluate',
        'params': {
            'expression': '''
                (function() {
                    const btn = document.querySelector('[aria-label="Close statistics dialog"]');
                    if (btn) btn.click();
                })()
            '''
        }
    }))
    ws.recv()
    time.sleep(0.5)

    # Click Settings button
    ws.send(json.dumps({
        'id': 24,
        'method': 'Runtime.evaluate',
        'params': {
            'expression': '''
                (function() {
                    const btn = document.querySelector('[aria-label="Game Settings"]');
                    if (btn) btn.click();
                })()
            '''
        }
    }))
    ws.recv()
    time.sleep(0.6)
    capture('scripts/design_modal_settings.png')

    # Close Settings button
    ws.send(json.dumps({
        'id': 25,
        'method': 'Runtime.evaluate',
        'params': {
            'expression': '''
                (function() {
                    const btn = document.querySelector('[aria-label="Close settings dialog"]');
                    if (btn) btn.click();
                })()
            '''
        }
    }))
    ws.recv()
    time.sleep(0.5)

    ws.close()
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
