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

    # Wait for initial launch screen animation to complete (~2.5s)
    time.sleep(2.5)

    viewports = [
        (390, 844, 'scripts/rendered_mobile_390x844.png'),
        (412, 915, 'scripts/rendered_mobile_412x915.png'),
        (360, 640, 'scripts/rendered_mobile_360x640.png'),
    ]

    for w, h, path in viewports:
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
        time.sleep(0.5)

        ws.send(json.dumps({'id': 2, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
        res = json.loads(ws.recv())
        data = base64.b64decode(res['result']['data'])
        with open(path, 'wb') as f:
            f.write(data)
        print(f"Captured {path} ({w}x{h})")

    # Now type a guess on 390x844
    ws.send(json.dumps({
        'id': 10,
        'method': 'Emulation.setDeviceMetricsOverride',
        'params': {
            'width': 390,
            'height': 844,
            'deviceScaleFactor': 2,
            'mobile': True,
        }
    }))
    ws.recv()
    time.sleep(0.3)

    for letter in ['C', 'R', 'A', 'N', 'E']:
        ws.send(json.dumps({
            'id': 20,
            'method': 'Input.dispatchKeyEvent',
            'params': {'type': 'keyDown', 'key': letter, 'code': f'Key{letter}'}
        }))
        ws.recv()
        time.sleep(0.08)
        ws.send(json.dumps({
            'id': 21,
            'method': 'Input.dispatchKeyEvent',
            'params': {'type': 'keyUp', 'key': letter, 'code': f'Key{letter}'}
        }))
        ws.recv()
        time.sleep(0.08)

    # Press Enter
    ws.send(json.dumps({
        'id': 22,
        'method': 'Input.dispatchKeyEvent',
        'params': {'type': 'keyDown', 'key': 'Enter', 'code': 'Enter'}
    }))
    ws.recv()
    time.sleep(0.08)
    ws.send(json.dumps({
        'id': 23,
        'method': 'Input.dispatchKeyEvent',
        'params': {'type': 'keyUp', 'key': 'Enter', 'code': 'Enter'}
    }))
    ws.recv()
    time.sleep(1.8) # Wait for tile reveal animation

    ws.send(json.dumps({'id': 24, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
    res = json.loads(ws.recv())
    data = base64.b64decode(res['result']['data'])
    with open('scripts/rendered_gameplay_played.png', 'wb') as f:
        f.write(data)
    print("Captured scripts/rendered_gameplay_played.png")

    ws.close()
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
