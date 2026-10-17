"""Build short, answer-safe offline clues from editorial overrides and cited introductions."""
import json,re,unicodedata,collections,hashlib
from pathlib import Path
BANK=Path('lib/question-bank.json');bank=json.loads(BANK.read_text());root=Path('.sites-runtime/clue-sources')
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFD',s.lower().replace('œ','oe').replace('æ','ae')).encode('ascii','ignore').decode())
def key(q):return q['theme']+':'+norm(q['answer'])
def safe(s,q):
 n=norm(s)
 return bool(s) and not any(norm(a) in n for a in [q['answer']]+q.get('aliases',[]) if len(norm(a))>=3)
manual={};theme='expressions'
for line in Path('data/clue-overrides.txt').read_text().splitlines():
 if not line or line.startswith('#'):continue
 if line.startswith('['):theme=line[1:-1];continue
 answer,clue=line.split('|',1);manual[theme+':'+norm(answer)]=clue

sources={};redirects={}
snapshot=Path('data/clue-introductions.json')
if snapshot.exists():
 cached=json.loads(snapshot.read_text());sources.update(cached['pages']);redirects.update(cached['redirects'])
for f in root.glob('*.json'):
 d=json.loads(f.read_text()).get('query',{})
 for entry in d.get('normalized',[])+d.get('redirects',[]):redirects[entry['from'].replace('_',' ')]=entry['to'].replace('_',' ')
 for p in d.get('pages',[]):sources[p['title']]=p

snapshot.write_text(json.dumps({'retrieved':'2026-10-16','source':'Wikipédia, introductions des articles cités ; historique des auteurs sur chaque page.','license':'CC BY-SA 4.0','pages':{title:{k:v for k,v in p.items() if k in ['title','extract','missing','pageprops']} for title,p in sources.items()},'redirects':redirects},ensure_ascii=False,indent=2)+'\n')

def clean(s):
 s=re.sub(r'\[[^\]]*\]','',s).replace('\n',' ')
 for _ in range(4):s=re.sub(r'\([^()]*\)','',s)
 s=re.sub(r'\s+',' ',s).strip()
 s=re.sub(r'\s+([,;.])',r'\1',s)
 return s

def shorten(s):
 s=s.strip(' ,;:.')
 if len(s)>185:
  for sep in [', dont ', ', qui ', ', avec ', '; ', '. ', ', ']:
   at=s.rfind(sep,45,180)
   if at>=65:s=s[:at];break
 if len(s)>185:return None
 if len(s)<20:return None
 return s[0].upper()+s[1:]+('.' if s[-1] not in '.!?' else '')

def from_page(q,p):
 if not p or p.get('missing') or 'disambiguation' in p.get('pageprops',{}):return None
 extract=clean(p.get('extract',''))
 expected={
 'videogames':r'jeu[x]? vidéo|vidéolud|Nintendo|PlayStation|Xbox|arcade',
 'series':r'série|dessin animé|anime|animation|feuilleton|sitcom',
 'characters':r'personnage|fiction|héros|héroïne|incarné|interprété|protagoniste',
 'music':r'chanteu[rs]|chanteuse|musicien|rappeu[rs]|rappeuse|groupe|compositeur|compositrice|guitariste|disc-jockey|duo|trio|collectif|DJ|rock',
 'food':r'cuisin|plat|pâtisser|dessert|gâteau|recette|préparat|spécialité|pain|aliment|frit|salade|sauce|viande|lait|farine|chocolat|fromage|pomme|riz|légum|fruit|boiss|céréale|cuit',
 }
 if q['theme'] in expected and not re.search(expected[q['theme']],extract,re.I):return None
 sentences=re.split(r'(?<=[a-zà-ÿ0-9»])[.!?]\s+(?=[A-ZÀ-Ü«])',extract)
 candidates=[]
 for i,s in enumerate(sentences):
  if i==0:
   match=re.search(r'\b(?:est|sont|désigne)\b[,\s]+(.*)',s)
   if match:s=match.group(1);s=re.sub(r'^dans (?:la|le|les) [^,]{1,65},\s*','',s,flags=re.I)
   else:continue
  s=re.sub(r'^(?:un|une|des)\s+','',s,flags=re.I)
  s=re.sub(r' en (?:un pilote de \d+ minutes? et )?\d+ épisodes?(?: de \d+ minutes?)?(?: sur \d+ saisons?)?', '',s,flags=re.I)
  s=re.sub(r' comptant \d+ épisodes?(?: de \d+ minutes?)?', '',s,flags=re.I)
  s=re.sub(r',? diffusée? (?:depuis|du|sur|entre|pour)[\s\S]*','',s,flags=re.I)
  if i>0 and re.match(r'^(?:Il |Elle |Ils |Elles |Ce |Cet |Ces |Cette |Le jeu |La série |Les deux |Son |Sa |Ses |À |En |Depuis |Après |Il s’agit)',s):
   if not re.search(r'(?i)raconte|met en scène|incarné|interprété|mesure|pèse|plumage|pelage|nourrit|répand|capitale|habite|\bvit\b|suit (?:les|l[’\'])',s):continue
  short=shorten(s)
  if not short or not safe(short,q):continue
  if re.search(r'(?i)homonym|peut désigner|voir aussi|cet article|article de|cette page|ci-dessous|nom de famille',short):continue
  score=3 if i==0 else 0
  if q['theme']=='animals' and re.search(r'(?i)mesure|pèse|plumage|pelage|nourrit|répand|habite|habitat|\bvit\b|reconnaissable',short):score+=6
  if re.search(r'(?i)met en scène|raconte|suit les|suit l[’\']|connu|célèbre|réputé|incarné|interprété|enquête|aventure|quête|héros|protagoniste|composé|garnie?|fourré|préparé|permet|utilisé|sert à|attribut|dieu|déesse|divinité',short):score+=4
  if re.search(r'(?i)espèce d[’\']|genre de|famille des',short) and len(short)<65:score-=2
  if re.search(r'(?i)\b(?:actuellement|depuis 202[4-9]|aujourd’hui|nouveau|prochain)\b',short):score-=5
  candidates.append((score,-i,short))
 if not candidates:return None
 return max(candidates)[2]

clues={};audit={};missing=[];counts=collections.Counter()
for index,q in enumerate(bank):
 k=key(q);title=q['wiki'].replace('_',' ');seen=set()
 if q['theme'] in ['people','music'] and k not in manual:
  other=('music' if q['theme']=='people' else 'people')+':'+norm(q['answer'])
  if other in manual:manual[k]=manual[other]
 while title in redirects and title not in seen:seen.add(title);title=redirects[title]
 p=sources.get(title)
 if k in manual:
  clue=manual[k]
  if not safe(clue,q):raise ValueError('Answer leak in authored clue: '+q['answer'])
  origin='editorial'
 else:
  clue=from_page(q,p);origin='wikipedia'
  # Preserve already-written, specific launch-bank clues instead of replacing them with taxonomy.
  if index<60 and safe(q['hint'],q):clue=q['hint'];origin='launch-editorial'
 if not clue:
  missing.append({'theme':q['theme'],'answer':q['answer'],'wiki':q['wiki'],'hint':q['hint'],'page':p.get('title') if p else None,'extract':p.get('extract','')[:450] if p else ''});continue
 clues[k]=clue;counts[q['theme']]+=1
 audit[k]={'kind':origin,**({'page':'https://fr.wikipedia.org/wiki/'+title.replace(' ','_'),'title':title,'license':'CC BY-SA 4.0'} if origin=='wikipedia' else {})}
Path('lib/question-clue-sources.json').write_text(json.dumps({k:v['page'] for k,v in audit.items() if v['kind']=='wikipedia'},ensure_ascii=False,indent=2)+'\n')
Path('lib/question-clues.json').write_text(json.dumps(clues,ensure_ascii=False,indent=2)+'\n')
Path('data/clue-sources.json').write_text(json.dumps({'retrieved':'2026-10-16','attribution':'Wikipédia, contributeurs de chaque article ; adaptation pour le jeu. CC BY-SA 4.0. Historique et auteurs sur la page source.','license':'https://creativecommons.org/licenses/by-sa/4.0/','entries':audit},ensure_ascii=False,indent=2)+'\n')
Path('.sites-runtime/clues-missing.json').write_text(json.dumps(missing,ensure_ascii=False,indent=2)+'\n')
print('Clues',len(clues),'/',len(bank),dict(counts),'missing',len(missing))
