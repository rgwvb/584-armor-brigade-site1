import io,json,os,re,requests,openpyxl
from datetime import datetime
from zoneinfo import ZoneInfo
PEOPLE=['鍾曜遠','王奕文','吳承恩','林鶴翔','胡育祥','康思賢','郭致嘉','翁和緯']
DAYS=['一','二','三','四','五','六']

def clean(v):
    if v is None:return None
    if isinstance(v,str):
        v=v.replace('\xa0',' ').strip();return v or None
    return v

def is_credit(v):
    try:
        f=float(str(v).strip());return 0 < f <= 6 and f.is_integer()
    except:return False

def room_credit(a,b):
    a,b=clean(a),clean(b)
    if is_credit(a) and not is_credit(b):return b,a
    if is_credit(b) and not is_credit(a):return a,b
    return a,b

def load_xlsx():
    url=os.getenv('ONEDRIVE_XLSX_URL','').strip()
    if not url:raise SystemExit('Missing ONEDRIVE_XLSX_URL secret')
    r=requests.get(url,timeout=60,allow_redirects=True);r.raise_for_status()
    if 'text/html' in r.headers.get('content-type',''):
        raise SystemExit('ONEDRIVE_XLSX_URL returned HTML. Use a direct/download URL.')
    return openpyxl.load_workbook(io.BytesIO(r.content),data_only=True)

def parse(ws):
    result={d:[] for d in DAYS}
    for col,day in enumerate(DAYS,2):
        row=3
        while row<=31:
            course=clean(ws.cell(row,col).value)
            if not course:row+=4;continue
            end=row
            while end+4<=31 and clean(ws.cell(end+4,col).value)==course:end+=4
            teacher=clean(ws.cell(row+1,col).value) or '未填'
            room,credits=room_credit(ws.cell(row+2,col).value,ws.cell(row+3,col).value)
            periods=[]
            for rr in range(row,end+1,4):
                m=re.search(r'第(\d+)節',str(ws.cell(rr,1).value or ''))
                if m:periods.append(int(m.group(1)))
            result[day].append({
                'course':str(course),'start':str(clean(ws.cell(row+1,1).value) or ''),
                'end':str(clean(ws.cell(end+3,1).value) or ''),'teacher':str(teacher),
                'room':str(room or '未填'),'credits':str(credits if credits is not None else '未填'),
                'periods':periods})
            row=end+4
    return result

def main():
    wb=load_xlsx();missing=[n for n in PEOPLE if n not in wb.sheetnames]
    if missing:raise SystemExit('Missing sheets: '+','.join(missing))
    out={'updated_at':datetime.now(ZoneInfo('Asia/Taipei')).isoformat(),'people':{n:parse(wb[n]) for n in PEOPLE}}
    os.makedirs('schedule/data',exist_ok=True)
    with open('schedule/data/schedule.json','w',encoding='utf-8') as f:json.dump(out,f,ensure_ascii=False,indent=2)
    print('Synced',len(PEOPLE),'people')
if __name__=='__main__':main()
