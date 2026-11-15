# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["whisperx==3.8.6", "soundfile==0.13.1"]
# ///
"""Automatically align authored English to WAV audio. No paid APIs.

uv run --python 3.11 scripts/alignSentenceAudio.py \
  --audio public/audio/kokoro-preview/hotel.wav --text 'I am going to the hotel.'
For batches, --jobs jobs.json accepts [{audio,text,output?}, ...]. Existing
matching hashes are skipped; the alignment model loads once for all jobs.
"""
import argparse
import hashlib
import json
import math
import re
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--audio')
    parser.add_argument('--text')
    parser.add_argument('--output')
    parser.add_argument('--jobs')
    args = parser.parse_args()
    if not args.jobs and not (args.audio and args.text):
        parser.error('Use --audio and --text, or --jobs')
    jobs = json.loads(Path(args.jobs).read_text()) if args.jobs else [vars(args)]
    import numpy as np
    import soundfile as sf
    import torch
    import torchaudio
    from whisperx.alignment import load_align_model, align
    model = metadata = None
    failed = 0
    for job in jobs:
        try:
            audio_path = Path(job['audio'])
            text = job['text']
            output = Path(job.get('output') or str(audio_path.with_suffix('.timing.json')))
            digest = hashlib.sha256(audio_path.read_bytes() + text.encode() + b'whisperx-en-v2').hexdigest()
            if output.exists() and json.loads(output.read_text()).get('alignmentHash') == digest:
                print(f'Cached: {output}', flush=True)
                continue
            if model is None:
                model, metadata = load_align_model('en', 'cpu')
            samples, rate = sf.read(audio_path, dtype='float32', always_2d=True)
            audio = torch.from_numpy(samples.mean(axis=1))
            if rate != 16000:
                audio = torchaudio.functional.resample(audio, rate, 16000)
            duration = len(audio) / 16000
            result = align([{'start':0, 'end':duration, 'text':text}], model, metadata,
                           audio.numpy().astype(np.float32), 'cpu', interpolate_method='ignore', return_char_alignments=False)
            tokens = list(re.finditer(r"[^\W_]+(?:['’][^\W_]+)*", text, re.UNICODE))
            aligned = result['word_segments']
            if len(aligned) != len(tokens):
                raise ValueError('Alignment did not return every word; refusing guessed timing')
            words = []
            for token, word in zip(tokens, aligned):
                normalized = re.sub(r"[^\w'’]", '', word['word']).lower()
                if normalized != token.group().lower() or 'start' not in word or 'end' not in word:
                    raise ValueError(f'Unaligned word: {token.group()}')
                if not all(math.isfinite(word[key]) for key in ('start', 'end')) or not 0 <= word['start'] < word['end'] <= duration:
                    raise ValueError(f'Invalid alignment: {token.group()}')
                words.append({'text':token.group(), 'start':token.start(), 'end':token.end(),
                              'startTime':word['start'], 'endTime':word['end']})
            value = {'version':1, 'text':text, 'words':words, 'alignmentHash':digest,
                     'aligner':'whisperx-wav2vec2-en'}
            output.parent.mkdir(parents=True, exist_ok=True)
            temporary = output.with_suffix(output.suffix + '.tmp')
            temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
            temporary.replace(output)
            print(f'Aligned: {output}', flush=True)
        except Exception as error:
            failed += 1
            print(f"Failed: {job.get('audio')}: {error}", flush=True)
    if failed:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
