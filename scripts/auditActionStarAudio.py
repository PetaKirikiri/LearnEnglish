"""Decode existing PCM recordings; this is not a speech-recognition or listening audit."""
import json, wave, math, struct
from pathlib import Path
report=json.loads(Path('reports/action-stars.json').read_text())
items=[{'id':r['id'],'audio':r['audio'],'kind':'question'} for r in report['rows']]+[{'id':r['id'],'audio':r['audioUrl'],'kind':'teaching'} for r in report['teachingExamples']]
rows=[]
for item in items:
    with wave.open('public'+item['audio'],'rb') as w:
        channels,rate,width,count=w.getnchannels(),w.getframerate(),w.getsampwidth(),w.getnframes()
        data=w.readframes(count)
    if width!=2: raise ValueError('Unsupported sample format: '+item['audio'])
    samples=struct.unpack('<'+'h'*(len(data)//2),data)
    peak=max(abs(s) for s in samples)
    rms=math.sqrt(sum(s*s for s in samples)/len(samples))
    seconds=count/rate
    if seconds<.5 or peak<100 or rms<10: raise ValueError('Empty/quiet/truncated recording: '+item['audio'])
    rows.append({**item,'seconds':round(seconds,3),'rate':rate,'channels':channels,'peak':peak,'rms':round(rms,2)})
Path('reports/action-stars-audio.json').write_text(json.dumps({'decoded':len(rows),'findings':[],'method':'All PCM frames decoded; duration, peak and RMS checked. Not a pronunciation certification.','rows':rows},indent=2)+'\n')
print(str(len(rows))+' recordings decoded; no signal-integrity findings')
