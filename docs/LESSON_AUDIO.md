# Lesson voice

Lesson recordings use Kokoro 1.0, `af_heart`, American English at speed 0.95. They are generated ahead of time as 24 kHz PCM WAV files, so learners hear the same voice on every device. No inference service or API key is required at playback time. Playback errors offer a retry; never silently substitute the first browser/system voice.

Source: [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT), [Kokoro 82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0). Model files remain in the local cache, outside the repository.

## Regeneration

Use Python 3.12 and an isolated environment at `~/.cache/englishsuccess-voice/venv`. Install `kokoro-onnx==0.6.1` and `soundfile==0.14.0`. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the upstream `model-files-v1.1` release to `~/.cache/englishsuccess-voice/models`.

Run `npm run audio:generate`. `VOICE_PYTHON` and `VOICE_MODEL_DIR` can override the Python executable and model directory. The command reads the configured language database snapshot before building the current course's audio inventory. It does not alter database content.

The generator inserts 650 ms of real silence between the visible halves of a grammar blank. It never synthesizes the hidden answer or placeholder characters. Full sentence recordings are separate and play after answering. `voice-manifest.json` records the exact spoken text, voice revision, duration and fingerprint, so interrupted jobs can resume without mixing old system speech into completed entries. All required entries must be regenerated before publishing. Change the playback cache revision when replacing a voice.

## Answer flow

Correct answers advance 1.4 seconds after playback completes or is blocked. A 25-second media watchdog prevents a missing completion event from trapping the learner. Word help, reports, profile, leaderboard, and an expanded explanation pause automatic advancement. Wrong answers stay until Next; Next remains available in the sticky feedback panel. Existing answer locking protects against duplicate scoring or a manual Next racing the timer.
