import math, wave, struct, random, subprocess
from pathlib import Path
R=44100
out=Path('public/audio/slapstick-v1');out.mkdir(parents=True,exist_ok=True)
rng=random.Random(14)

def synth(dur,func):
    return [func(i/R,i/(dur*R)) for i in range(round(dur*R))]
def env(t,u,a=.006,decay=1.5):return min(1,t/a)*max(0,1-u)**decay

def whistle(start,end,dur):
    phase=0
    def f(t,u):
        nonlocal phase
        hz=start*(end/start)**u
        phase+=2*math.pi*hz/R
        return (math.sin(phase)+.075*math.sin(phase*2))*env(t,u,decay=.35)*min(1,(dur-t)/.025)
    return synth(dur,f)
def boing(start,dur):
    phase=0
    def f(t,u):
        nonlocal phase
        hz=85+(start-85)*math.exp(-t*6)+95*math.sin(t*2*math.pi*18)*math.exp(-t*5)
        phase+=2*math.pi*max(45,hz)/R
        return (math.sin(phase)+.3*math.sin(phase*2)+.12*math.sin(phase*4))*env(t,u,decay=1.4)
    return synth(dur,f)
def horn(start,end,dur,bright=False):
    phase=0
    def f(t,u):
        nonlocal phase
        hz=start+(end-start)*u+4*math.sin(t*2*math.pi*12)
        phase+=2*math.pi*hz/R
        s=sum(math.sin(phase*h)*math.exp(-h/(5 if bright else 2.6))/h for h in range(1,16))
        return s*env(t,u,a=.012,decay=.5)*min(1,(dur-t)/.02)
    return synth(dur,f)
def hit(dur=.12,metal=False):
    def f(t,u):
        if metal:s=sum(math.sin(t*2*math.pi*h)*math.exp(-t*k) for h,k in [(420,17),(789,25),(1317,35),(2221,45)])*.3
        else:s=math.sin(2*math.pi*(130*t-180*t*t))*math.exp(-t*40)+rng.uniform(-1,1)*math.exp(-t*65)*.6
        return s*min(1,t/.001)*max(0,1-u)
    return synth(dur,f)
def pop():
    return whistle(1500,180,.07)
def bell(freq,dur=.24):
    return synth(dur,lambda t,u:(math.sin(2*math.pi*freq*t)*math.exp(-t*12)+.16*math.sin(2*math.pi*freq*2.76*t)*math.exp(-t*25))*env(t,u,a=.002,decay=.7))
def laugh():
    phase=0
    def f(t,u):
        nonlocal phase
        hz=300-95*u+40*math.sin(2*math.pi*t*8)
        phase+=2*math.pi*hz/R
        pulse=max(0,math.sin(2*math.pi*t*8))**1.6
        voice=sum(math.sin(phase*h)*(.1/h+math.exp(-((h*hz-950)/380)**2)*.28) for h in range(1,10))
        return voice*pulse*env(t,u,decay=.4)
    return synth(.62,f)
def mix(events,dur=.85):
    result=[0.0]*round(dur*R)
    for at,data,volume in events:
        off=round(at*R)
        for i,v in enumerate(data[:len(result)-off]):result[off+i]+=v*volume
    peak=max(map(abs,result)) or 1
    return [math.tanh(v/peak*.8)*.72 for v in result]

# Original synthesis with the vocabulary of classic slapstick cartoon foley.
fx=[
 ('applaudissements',mix([(0,hit(.08),.65),(.09,hit(.08),.8),(.18,hit(.08),.9),(.29,hit(.16,True),.5)])),
 ('rire',mix([(0,laugh(),1),(.48,hit(.12,True),.18)])),
 ('reflexion',mix([(0,whistle(450,1450,.32),.8),(.33,pop(),.5)])),
 ('feu',mix([(0,whistle(220,1800,.2),.8),(.19,hit(.2,True),.55),(.22,boing(480,.4),.5)])),
 ('fete',mix([(0,horn(520,520,.11,True),.6),(.12,horn(660,660,.11,True),.6),(.24,horn(780,780,.24,True),.7),(.35,hit(.22,True),.3)])),
 ('coeur',mix([(0,pop(),.45),(.13,whistle(700,1600,.28),.8),(.33,bell(1320),.4)])),
 ('pouce-haut',mix([(0,boing(650,.65),.85),(.35,bell(1450,.22),.3)])),
 ('pouce-bas',mix([(0,horn(310,270,.13),.8),(.14,horn(270,220,.13),.8),(.28,horn(220,135,.35),.85)])),
 ('canard',mix([(0,horn(480,250,.19,True),.85),(.23,horn(580,220,.23,True),.9)])),
 ('chien',mix([(0,horn(180,80,.12,True),.9),(.18,horn(230,90,.15,True),.9),(.4,boing(350,.3),.3)])),
]
joined=[0.0]*round(12.4*R)
for n,(name,data) in enumerate(fx):
    off=round((.15+n*1.2)*R)
    joined[off:off+len(data)]=data
    assert all(math.isfinite(x) for x in data)
    print(n+1,name,round(max(map(abs,data)),3))
for name,data in fx:
    with wave.open(str(out/(name+'.wav')),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(R)
        w.writeframes(b''.join(struct.pack('<h',round(x*32767)) for x in data))
p=Path('.sites-runtime/slapstick-audition.wav');p.parent.mkdir(exist_ok=True) 
with wave.open(str(p),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(R)
    w.writeframes(b''.join(struct.pack('<h',round(x*32767)) for x in joined))
