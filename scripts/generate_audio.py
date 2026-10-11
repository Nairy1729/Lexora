import numpy as np
import wave
import struct
import math

SAMPLE_RATE = 44100
DURATION = 28.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

def synthesize_audio(output_path="scripts/lexora_soundtrack.wav"):
    t = np.linspace(0, DURATION, TOTAL_SAMPLES, endpoint=False)
    left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

    # Helper: Add stereo synth voice
    def add_voice(freq, start, end, amp=0.1, pan=0.0, detune=0.005, wave_type='saw'):
        idx_start = max(0, int(start * SAMPLE_RATE))
        idx_end = min(TOTAL_SAMPLES, int(end * SAMPLE_RATE))
        if idx_start >= idx_end:
            return
        
        dur = end - start
        t_sub = np.linspace(0, dur, idx_end - idx_start, endpoint=False)
        
        # Smooth attack and release envelope
        att = min(0.4, dur * 0.25)
        rel = min(0.6, dur * 0.35)
        env = np.ones_like(t_sub)
        
        att_samples = int(att * SAMPLE_RATE)
        if att_samples > 0:
            env[:att_samples] = np.sin(np.linspace(0, np.pi/2, att_samples))**2
            
        rel_samples = int(rel * SAMPLE_RATE)
        if rel_samples > 0:
            env[-rel_samples:] = np.cos(np.linspace(0, np.pi/2, rel_samples))**2

        # Rich multi-oscillator detuned sound
        f1 = freq * (1.0 - detune)
        f2 = freq
        f3 = freq * (1.0 + detune)
        
        if wave_type == 'saw':
            # Band-limited pseudo-saw (sum of sines)
            sig = (np.sin(2 * np.pi * f1 * t_sub) * 0.5 +
                   np.sin(2 * np.pi * f2 * t_sub) * 0.7 +
                   np.sin(2 * np.pi * f3 * t_sub) * 0.5 +
                   np.sin(2 * np.pi * f2 * 2 * t_sub) * 0.25 +
                   np.sin(2 * np.pi * f2 * 3 * t_sub) * 0.12) / 2.0
        else: # sine/triangle
            sig = (np.sin(2 * np.pi * f1 * t_sub) * 0.5 +
                   np.sin(2 * np.pi * f2 * t_sub) * 0.7 +
                   np.sin(2 * np.pi * f3 * t_sub) * 0.5) / 1.7
        
        sig = sig * env * amp
        l_gain = math.sqrt(0.5 * (1.0 - pan))
        r_gain = math.sqrt(0.5 * (1.0 + pan))
        
        left[idx_start:idx_end] += sig * l_gain
        right[idx_start:idx_end] += sig * r_gain

    # --- 1. AMBIENT SYNTHESIZER PROGRESSION ---
    # Chords:
    # 0.0 - 5.0s: D minor (D2: 73.4, A2: 110.0, D3: 146.8, F3: 174.6, A3: 220.0)
    for f, p in [(73.4, 0.0), (110.0, -0.3), (146.8, 0.3), (174.6, -0.2), (220.0, 0.2)]:
        add_voice(f, 0.0, 5.2, amp=0.08, pan=p, wave_type='saw')
        
    # 4.8 - 9.0s: Dm9 (D2: 73.4, A2: 110.0, E3: 164.8, F3: 174.6, C4: 261.6)
    for f, p in [(73.4, 0.0), (110.0, -0.2), (164.8, 0.3), (174.6, -0.3), (261.6, 0.2)]:
        add_voice(f, 4.8, 9.2, amp=0.09, pan=p, wave_type='saw')

    # 8.8 - 15.6s: F major / A minor (F2: 87.3, C3: 130.8, F3: 174.6, A3: 220.0, C4: 261.6)
    for f, p in [(87.3, 0.0), (130.8, -0.3), (174.6, 0.2), (220.0, -0.2), (261.6, 0.3)]:
        add_voice(f, 8.8, 15.8, amp=0.10, pan=p, wave_type='saw')

    # 15.4 - 18.0s: Bb major (Bb2: 116.5, F3: 174.6, Bb3: 233.1, D4: 293.7)
    for f, p in [(116.5, 0.0), (174.6, -0.3), (233.1, 0.3), (293.7, -0.1)]:
        add_voice(f, 15.4, 18.2, amp=0.11, pan=p, wave_type='saw')

    # 18.0 - 22.0s: Triumph / Resolution to D minor (D2: 73.4, A2: 110.0, D3: 146.8, F3: 174.6, A3: 220.0, D4: 293.7)
    for f, p in [(73.4, 0.0), (110.0, -0.3), (146.8, 0.3), (174.6, -0.2), (220.0, 0.2), (293.7, 0.0)]:
        add_voice(f, 18.0, 22.2, amp=0.13, pan=p, wave_type='saw')

    # 21.8 - 25.8s: Ethereal Dm pad
    for f, p in [(110.0, -0.2), (146.8, 0.2), (174.6, -0.1), (220.0, 0.1)]:
        add_voice(f, 21.8, 26.0, amp=0.08, pan=p, wave_type='sine')

    # 25.5 - 28.0s: Resolving End Card Tonic Chord (D3, A3, D4)
    for f, p in [(146.8, 0.0), (220.0, -0.2), (293.7, 0.2)]:
        add_voice(f, 25.5, 28.0, amp=0.07, pan=p, wave_type='sine')

    # --- 2. DEEP SUB-BASS DRONE ---
    sub_bass = np.sin(2 * np.pi * 55.0 * t) * 0.06
    # swell during scenes 2, 4, 6
    sub_env = (1.0 + 0.5 * np.sin(2 * np.pi * 0.15 * t)) * (1.0 - np.clip(t / 28.0, 0, 1)**4)
    left += sub_bass * sub_env * 0.5
    right += sub_bass * sub_env * 0.5

    # --- 3. TACTILE KEYBOARD CLICK SFX ---
    def add_click(timestamp, pitch=2200, amp=0.15):
        idx = int(timestamp * SAMPLE_RATE)
        dur_samples = int(0.018 * SAMPLE_RATE)
        if idx + dur_samples >= TOTAL_SAMPLES:
            return
        t_click = np.linspace(0, 0.018, dur_samples, endpoint=False)
        # Noise burst + short damped sine
        noise = np.random.uniform(-1, 1, dur_samples) * np.exp(-t_click * 300)
        sine = np.sin(2 * np.pi * pitch * t_click) * np.exp(-t_click * 200)
        click = (noise * 0.4 + sine * 0.6) * amp
        left[idx:idx+dur_samples] += click * 0.85
        right[idx:idx+dur_samples] += click * 0.85

    # Typing Scene 3: C, R, A, N, E (9.1, 9.5, 9.9, 10.3, 10.7s)
    click_times = [9.1, 9.5, 9.9, 10.3, 10.7]
    click_pitches = [2100, 2300, 2150, 2400, 2250]
    for ct, cp in zip(click_times, click_pitches):
        add_click(ct, pitch=cp, amp=0.20)

    # Enter Thud (11.2s)
    idx_enter = int(11.2 * SAMPLE_RATE)
    dur_enter = int(0.06 * SAMPLE_RATE)
    t_enter = np.linspace(0, 0.06, dur_enter, endpoint=False)
    enter_thud = (np.sin(2 * np.pi * 140 * t_enter) * 0.7 +
                  np.sin(2 * np.pi * 80 * t_enter) * 0.5 +
                  np.random.uniform(-0.5, 0.5, dur_enter) * 0.3) * np.exp(-t_enter * 60) * 0.28
    left[idx_enter:idx_enter+dur_enter] += enter_thud
    right[idx_enter:idx_enter+dur_enter] += enter_thud

    # --- 4. TILE FLIP / EVALUATION SOUNDS ---
    def add_tile_flip(timestamp, note_type='absent'):
        idx = int(timestamp * SAMPLE_RATE)
        dur = int(0.18 * SAMPLE_RATE)
        if idx + dur >= TOTAL_SAMPLES:
            return
        t_flip = np.linspace(0, 0.18, dur, endpoint=False)
        whoosh = np.sin(2 * np.pi * np.linspace(180, 420, dur) * t_flip) * np.exp(-t_flip * 25) * 0.12
        if note_type == 'absent':
            body = np.sin(2 * np.pi * 180 * t_flip) * np.exp(-t_flip * 35) * 0.14
        elif note_type == 'present':
            body = np.sin(2 * np.pi * 587 * t_flip) * np.exp(-t_flip * 20) * 0.18
        else: # correct
            body = np.sin(2 * np.pi * 880 * t_flip) * np.exp(-t_flip * 15) * 0.22
        snd = (whoosh + body)
        left[idx:idx+dur] += snd * 0.9
        right[idx:idx+dur] += snd * 0.9

    # Flip Row 1: C (absent), R (absent), A (present), N (present), E (present)
    flip_times_r1 = [11.8, 12.0, 12.2, 12.4, 12.6]
    flip_types_r1 = ['absent', 'absent', 'present', 'present', 'present']
    for ft, ftype in zip(flip_times_r1, flip_types_r1):
        add_tile_flip(ft, ftype)

    # --- 5. VICTORY CHIME SEQUENCE (SCENE 4) ---
    def add_crystal_chime(timestamp, freq, amp=0.25, pan=0.0):
        idx = int(timestamp * SAMPLE_RATE)
        dur = int(1.4 * SAMPLE_RATE)
        if idx + dur >= TOTAL_SAMPLES:
            dur = TOTAL_SAMPLES - idx
        t_chime = np.linspace(0, dur / SAMPLE_RATE, dur, endpoint=False)
        # Crystal bell with harmonic overtones (fundamental, 2.7x, 5.4x)
        bell = (np.sin(2 * np.pi * freq * t_chime) * 0.7 +
                np.sin(2 * np.pi * freq * 2.0 * t_chime) * 0.3 +
                np.sin(2 * np.pi * freq * 2.76 * t_chime) * 0.2 +
                np.sin(2 * np.pi * freq * 5.4 * t_chime) * 0.1) * np.exp(-t_chime * 3.5) * amp
        l_gain = math.sqrt(0.5 * (1.0 - pan))
        r_gain = math.sqrt(0.5 * (1.0 + pan))
        left[idx:idx+dur] += bell * l_gain
        right[idx:idx+dur] += bell * r_gain

    # 5 Ascending Pentatonic Chimes for Green Tiles: D5, F5, G5, A5, D6
    green_chimes = [
        (17.60, 587.3, -0.4),  # D5
        (17.85, 698.5, -0.2),  # F5
        (18.10, 783.9, 0.0),   # G5
        (18.35, 880.0, 0.2),   # A5
        (18.60, 1174.7, 0.4),  # D6
    ]
    for t_ch, f_ch, p_ch in green_chimes:
        add_crystal_chime(t_ch, f_ch, amp=0.28, pan=p_ch)

    # Victory Harmonic Shimmer Chords (18.6s - 22.0s)
    for f, p in [(587.3, -0.3), (880.0, 0.0), (1174.7, 0.3), (1760.0, -0.2)]:
        add_crystal_chime(18.65, f, amp=0.18, pan=p)

    # --- 6. RISERS & TRANSITIONAL SWEEPS ---
    def add_riser(start, end, max_amp=0.12):
        idx_start = int(start * SAMPLE_RATE)
        idx_end = int(end * SAMPLE_RATE)
        dur = end - start
        t_r = np.linspace(0, dur, idx_end - idx_start, endpoint=False)
        sweep_freq = np.linspace(120, 680, len(t_r))
        sweep = np.sin(2 * np.pi * sweep_freq * t_r) * (t_r / dur)**2.2 * max_amp
        noise = np.random.uniform(-1, 1, len(t_r)) * (t_r / dur)**2.5 * max_amp * 0.3
        left[idx_start:idx_end] += sweep + noise
        right[idx_start:idx_end] += sweep + noise

    add_riser(3.2, 4.4, max_amp=0.08)   # Into Scene 2
    add_riser(7.4, 8.4, max_amp=0.07)   # Into Scene 3
    add_riser(16.5, 17.5, max_amp=0.10) # Into Scene 4 Climax Reveal

    # Master Limiter & Normalize
    max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
    if max_val > 0.95:
        left = left / max_val * 0.92
        right = right / max_val * 0.92
    else:
        left = left * 0.92
        right = right * 0.92

    # Smooth master fade-out in final 1.2 seconds
    fade_len = int(1.2 * SAMPLE_RATE)
    fade_env = np.linspace(1.0, 0.0, fade_len)**2
    left[-fade_len:] *= fade_env
    right[-fade_len:] *= fade_env

    # Convert to 16-bit PCM WAV
    left_int16 = (left * 32767).astype(np.int16)
    right_int16 = (right * 32767).astype(np.int16)
    stereo_interleaved = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
    stereo_interleaved[0::2] = left_int16
    stereo_interleaved[1::2] = right_int16

    with wave.open(output_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(stereo_interleaved.tobytes())

    print(f"Generated soundtrack: {output_path} ({DURATION}s, {SAMPLE_RATE}Hz stereo)")

if __name__ == '__main__':
    synthesize_audio()
