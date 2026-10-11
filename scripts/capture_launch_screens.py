import urllib.request
import json
import time
import websocket
import subprocess
import base64

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
    
    # 1. Emulate mobile screen 390x844
    ws.send(json.dumps({
        'id': 1,
        'method': 'Emulation.setDeviceMetricsOverride',
        'params': {
            'width': 390,
            'height': 844,
            'deviceScaleFactor': 2,
            'mobile': True,
        }
    }))
    ws.recv()

    # 2. Reload to capture launch sequence from start
    ws.send(json.dumps({'id': 2, 'method': 'Page.reload'}))
    ws.recv()

    # Wait for entrance animation (~800ms)
    time.sleep(0.85)
    ws.send(json.dumps({'id': 3, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
    res = json.loads(ws.recv())
    data = base64.b64decode(res['result']['data'])
    with open('scripts/rendered_launch_screen_active.png', 'wb') as f:
        f.write(data)
    print("Screenshot saved to scripts/rendered_launch_screen_active.png")

    # Wait for sequence to complete and exit transition to finish (~2.2s total)
    time.sleep(1.6)
    ws.send(json.dumps({'id': 4, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
    res = json.loads(ws.recv())
    data = base64.b64decode(res['result']['data'])
    with open('scripts/rendered_launch_game_revealed.png', 'wb') as f:
        f.write(data)
    print("Screenshot saved to scripts/rendered_launch_game_revealed.png")

    ws.close()
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
