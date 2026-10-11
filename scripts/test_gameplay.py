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
    
    # Emulate mobile screen
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
    time.sleep(0.5)

    # Dispatch keyboard event: type 'CRANE' and press Enter
    for letter in ['C', 'R', 'A', 'N', 'E']:
        ws.send(json.dumps({
            'id': 10,
            'method': 'Input.dispatchKeyEvent',
            'params': {
                'type': 'keyDown',
                'key': letter,
                'code': f'Key{letter}',
            }
        }))
        ws.recv()
        time.sleep(0.1)
        ws.send(json.dumps({
            'id': 11,
            'method': 'Input.dispatchKeyEvent',
            'params': {
                'type': 'keyUp',
                'key': letter,
                'code': f'Key{letter}',
            }
        }))
        ws.recv()
        time.sleep(0.1)

    # Press Enter
    ws.send(json.dumps({
        'id': 12,
        'method': 'Input.dispatchKeyEvent',
        'params': {
            'type': 'keyDown',
            'key': 'Enter',
            'code': 'Enter',
        }
    }))
    ws.recv()
    time.sleep(0.1)
    ws.send(json.dumps({
        'id': 13,
        'method': 'Input.dispatchKeyEvent',
        'params': {
            'type': 'keyUp',
            'key': 'Enter',
            'code': 'Enter',
        }
    }))
    ws.recv()
    time.sleep(1.5) # Wait for reveal animation

    # Capture screenshot
    ws.send(json.dumps({'id': 14, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
    res = json.loads(ws.recv())
    data = base64.b64decode(res['result']['data'])
    with open('scripts/rendered_gameplay_played.png', 'wb') as f:
        f.write(data)
    print("Screenshot saved to scripts/rendered_gameplay_played.png")
        
    ws.close()
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
