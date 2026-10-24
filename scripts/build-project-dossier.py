"""Build the branded project handbook from the versioned, editable JSON source."""
from pathlib import Path
import json, html
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/projet'; OUT.mkdir(parents=True,exist_ok=True)
DATA=json.loads((OUT/'dossier.json').read_text())
ANNEX=OUT/'annexe-technique.json'
if ANNEX.exists(): DATA['pages']+=json.loads(ANNEX.read_text())
FONT=Path('/usr/share/fonts/truetype/dejavu')
for name,file in [('Sans','DejaVuSans.ttf'),('SansBold','DejaVuSans-Bold.ttf'),('Serif','DejaVuSerif.ttf'),('Mono','DejaVuSansMono.ttf')]:pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
W,H=A4; M=43; CW=W-2*M
INK=HexColor('#43573e'); MUTED=HexColor('#776a52'); PAPER=HexColor('#f6f0df'); SEAM=HexColor('#baa783'); SAGE=HexColor('#e2e8d2')
styles={
 'body':ParagraphStyle('body',fontName='Sans',fontSize=9.2,leading=14,textColor=INK,spaceAfter=9),
 'intro':ParagraphStyle('intro',fontName='Sans',fontSize=10.2,leading=16,textColor=MUTED),
 'h':ParagraphStyle('h',fontName='SansBold',fontSize=11,leading=16,textColor=INK),
 'cell':ParagraphStyle('cell',fontName='Sans',fontSize=8.3,leading=12,textColor=INK),
 'cellhead':ParagraphStyle('cellhead',fontName='SansBold',fontSize=8.1,leading=12,textColor=INK),
 'note':ParagraphStyle('note',fontName='Sans',fontSize=8.4,leading=12.5,textColor=MUTED),
 'title':ParagraphStyle('title',fontName='Serif',fontSize=25,leading=32,textColor=INK),
 'code':ParagraphStyle('code',fontName='Mono',fontSize=8,leading=12,textColor=INK)
}
def esc(s):return html.escape(s).replace('\n','<br/>')
def paragraph(c,text,y,kind='body',x=M,width=CW):
 p=Paragraph(esc(text),styles[kind]);_,h=p.wrap(width,800);p.drawOn(c,x,y-h);return y-h
def base(c,n,section):
 c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
 c.saveState();c.setFillAlpha(.07)
 tile=ImageReader(str(ROOT/'public/branding/textile/felt.webp'))
 for x in range(0,int(W),240):
  for y in range(0,int(H),240):c.drawImage(tile,x,y,240,240,mask='auto')
 c.restoreState();c.setStrokeColor(SEAM);c.setLineWidth(.65);c.setDash(2,2);c.roundRect(20,20,W-40,H-40,15,fill=0,stroke=1);c.setDash()
 c.drawImage(ImageReader(str(ROOT/'public/branding/kikalmo-stitched.webp')),M,H-65,116,30,mask='auto',preserveAspectRatio=True)
 c.setFont('Sans',8);c.setFillColor(MUTED);c.drawRightString(W-M,H-49,section.upper());c.setStrokeColor(SEAM);c.line(M,H-81,W-M,H-81)
 c.setFont('Sans',7.2);c.drawString(M,36,'Kikalmo · Dossier de projet · 24.10.2026');c.drawRightString(W-M,36,f'{n:02d} / {len(DATA["pages"])+1:02d}')
def table(c,rows,y):
 cols=len(rows[0]);widths=[CW/cols]*cols
 if cols==2:widths=[CW*.38,CW*.62]
 if cols==3:widths=[CW*.40,CW*.23,CW*.37]
 cells=[[Paragraph(esc(s),styles['cellhead' if i==0 else 'cell']) for s in row] for i,row in enumerate(rows)]
 t=Table(cells,colWidths=widths,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),SAGE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),.35,SEAM)]));_,h=t.wrap(CW,H);t.drawOn(c,M,y-h);return y-h-14
def build():
 path=OUT/'Kikalmo-dossier-projet.pdf';c=canvas.Canvas(str(path),pagesize=A4);c.setTitle('Kikalmo - Dossier de projet et mode opératoire');c.setAuthor('Emmanuel Galland')
 base(c,1,'Projet & prise en main')
 c.drawImage(ImageReader(str(ROOT/'public/branding/kikalmo-halloween.webp')),M,615,CW,147,mask='auto',preserveAspectRatio=True,anchor='c')
 y=paragraph(c,DATA['title'],585,'title');y=paragraph(c,'Jeu multijoueur · Boutique de skins · Amis & discussion',y-18,'intro')
 c.setFillColor(SAGE);c.roundRect(M,409,CW,80,15,fill=1,stroke=0)
 paragraph(c,'Conception, règles, parcours joueur, économie, architecture et maintenance. Une référence pratique pour utiliser le site et poursuivre son développement.',469,'intro',M+18,CW-36)
 for i,name in enumerate(['personnage','halloween','cosmonaute']):c.drawImage(ImageReader(str(OUT/'illustrations'/f'{name}.png')),M+i*(CW/3),185,CW/3,195,mask='auto',preserveAspectRatio=True)
 y=paragraph(c,'Édition du 24 octobre 2026 · Emmanuel Galland',166,'h');y=paragraph(c,'Version documentaire correspondant aux fonctionnalités du code, y compris le panneau de discussion et l’ajout d’ami en salon.',y-10,'note')
 c.setFont('Sans',7.8);c.setFillColor(INK);c.drawString(M,93,DATA['url']);c.linkURL(DATA['url'],(M,90,W-M,104),relative=0);c.drawString(M,76,DATA['repository']);c.linkURL(DATA['repository'],(M,73,W-M,87),relative=0);c.showPage()
 markdown=['# Kikalmo - Dossier de projet et mode opératoire','',f'Édition : {DATA["date"]}',f'Site : {DATA["url"]}',f'Sources : {DATA["repository"]}','']
 for n,page in enumerate(DATA['pages'],2):
  c.bookmarkPage(f'page-{n}');c.addOutlineEntry(page['section']+' - '+page['title'],f'page-{n}',level=0)
  base(c,n,page['section']);y=paragraph(c,page['title'],H-108,'title');y=paragraph(c,page['intro'],y-13,'intro')-20
  markdown+=['## '+page['title'],'',page['intro'],'']
  for kind,value in page['blocks']:
   if kind=='h':y=paragraph(c,value,y-1,'h')-7;markdown+=['### '+value,'']
   elif kind=='p':y=paragraph(c,value,y)-11;markdown+=[value,'']
   elif kind=='table':
    y=table(c,value,y);markdown+=['| '+' | '.join(value[0])+' |','| '+' | '.join(['---']*len(value[0]))+' |']+['| '+' | '.join(r)+' |' for r in value[1:]]+['']
   elif kind=='code':
    text=esc(value).replace(' ','&nbsp;');p=Paragraph(text,styles['code']);_,h=p.wrap(CW-26,800);c.setFillColor(SAGE);c.roundRect(M,y-h-20,CW,h+20,10,fill=1,stroke=0);p.drawOn(c,M+13,y-h-10);y-=h+34;markdown+=['```text',value,'```','']
   elif kind=='steps':
    for i,step in enumerate(value,1):
     c.setFillColor(SAGE);c.circle(M+8,y-8,8,fill=1,stroke=0);c.setFillColor(INK);c.setFont('SansBold',8);c.drawCentredString(M+8,y-11,str(i));y=paragraph(c,step,y,'body',M+25,CW-25)-10;markdown+=[f'{i}. {step}']
    markdown+=['']
   elif kind=='note':
    p=Paragraph(esc(value),styles['note']);_,h=p.wrap(CW-26,800);c.setFillColor(SAGE);c.roundRect(M,y-h-21,CW,h+21,10,fill=1,stroke=0);p.drawOn(c,M+13,y-h-10);y-=h+34;markdown+=['> '+value,'']
   if y<64:raise ValueError(f'Overflow page {n}: {y:.1f}')
  c.showPage()
 c.save();(OUT/'dossier-projet.md').write_text('\n'.join(markdown)+'\n');print(path)
if __name__=='__main__':build()
