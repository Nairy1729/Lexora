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
    
    viewports = [
        (390, 844, 'scripts/rendered_mobile_390x844.png'),
        (412, 915, 'scripts/rendered_mobile_412x915.png'),
        (360, 640, 'scripts/rendered_mobile_360x640.png'),
    ]
    
    for w, h, path in viewports:
        # Emulate mobile screen
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
        time.sleep(0.8)

        # Capture screenshot
        ws.send(json.dumps({'id': 2, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
        res = json.loads(ws.recv())
        data = base64.b64decode(res['result']['data'])
        with open(path, 'wb') as f:
            f.write(data)
        print(f"Screenshot saved to {path} ({w}x{h})")
        
    ws.close()
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
