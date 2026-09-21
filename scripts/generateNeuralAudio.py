"""Build consistent neural lesson recordings locally. See docs/LESSON_AUDIO.md."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

VOICE = 'af_heart'
SPEED = 0.95
VERSION = 'kokoro-1.0-heart-v1'
GAP_SECONDS = 0.65


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    items = json.load(sys.stdin)
    args.output.mkdir(parents=True, exist_ok=True)
    manifest_path = args.output / 'voice-manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    engine = Kokoro(str(args.model_dir / 'kokoro-v1.0.onnx'), str(args.model_dir / 'voices-v1.0.bin'))
    created = 0
    for index, item in enumerate(items):
        name = Path(item['audioUrl']).name
        output = args.output / name
        text = item['spokenText']
        fingerprint = hashlib.sha256(f'{VERSION}|{SPEED}|{GAP_SECONDS}|{text}'.encode()).hexdigest()
        if manifest.get(name, {}).get('fingerprint') == fingerprint and output.exists():
            continue
        # Synthesize only the visible words. Insert actual silence for the blank;
        # never pass underscores or the hidden answer to the speech engine.
        samples = []
        sample_rate = 24000
        for part_index, part in enumerate(text.split('_____')):
            if part_index:
                samples.append(np.zeros(round(sample_rate * GAP_SECONDS), dtype=np.float32))
            if part.strip():
                speech, rate = engine.create(part.strip(), voice=VOICE, speed=SPEED, lang='en-us')
                if rate != sample_rate:
                    raise ValueError(f'Unexpected sample rate: {rate}')
                samples.append(speech)
        audio = np.concatenate(samples)
        if not np.isfinite(audio).all() or len(audio) < 2400 or np.max(np.abs(audio)) < 0.01:
            raise ValueError(f'No usable speech: {name}')
        temporary = output.with_suffix('.tmp.wav')
        sf.write(temporary, audio, sample_rate, subtype='PCM_16')
        temporary.replace(output)
        manifest[name] = {'fingerprint': fingerprint, 'voice': VERSION, 'seconds': round(len(audio) / sample_rate, 3), 'text': text}
        temporary_manifest = manifest_path.with_suffix('.tmp.json')
        temporary_manifest.write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
        temporary_manifest.replace(manifest_path)
        created += 1
        if created % 20 == 0 or index == len(items) - 1:
            print(f'Neural audio: {index + 1}/{len(items)} ({created} generated)', flush=True)
    print(f'Complete: {len(items)} lesson clips, {created} regenerated.', flush=True)


if __name__ == '__main__':
    main()
