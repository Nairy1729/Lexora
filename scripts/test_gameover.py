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

    # Let's inspect localStorage to see current state or puzzle
    ws.send(json.dumps({
        'id': 20,
        'method': 'Runtime.evaluate',
        'params': {
            'expression': 'window.localStorage.getItem("@lexora/daily_game_state")'
        }
    }))
    res = json.loads(ws.recv())
    print("Daily game state:", res['result']['result'].get('value'))

    # Type 5 invalid guesses to lose or see game over
    guesses = ["SOARE", "CLINT", "FUDGY", "WHOMP", "BEZEL", "VIXEN"]
    for word in guesses:
        for letter in word:
            ws.send(json.dumps({
                'id': 30,
                'method': 'Input.dispatchKeyEvent',
                'params': {'type': 'keyDown', 'key': letter, 'code': f'Key{letter}'}
            }))
            ws.recv()
            time.sleep(0.04)
            ws.send(json.dumps({
                'id': 31,
                'method': 'Input.dispatchKeyEvent',
                'params': {'type': 'keyUp', 'key': letter, 'code': f'Key{letter}'}
            }))
            ws.recv()
            time.sleep(0.04)
        # Enter
        ws.send(json.dumps({
            'id': 32,
            'method': 'Input.dispatchKeyEvent',
            'params': {'type': 'keyDown', 'key': 'Enter', 'code': 'Enter'}
        }))
        ws.recv()
        time.sleep(0.05)
        ws.send(json.dumps({
            'id': 33,
            'method': 'Input.dispatchKeyEvent',
            'params': {'type': 'keyUp', 'key': 'Enter', 'code': 'Enter'}
        }))
        ws.recv()
        time.sleep(1.2)

    # Capture screenshot with game over
    ws.send(json.dumps({'id': 40, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
    res = json.loads(ws.recv())
    data = base64.b64decode(res['result']['data'])
    with open('scripts/rendered_gameover.png', 'wb') as f:
        f.write(data)
    print("Screenshot saved to scripts/rendered_gameover.png")
        
    ws.close()
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
