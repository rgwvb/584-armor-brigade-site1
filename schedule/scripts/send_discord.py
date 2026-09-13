import json,os,requests
from datetime import datetime
from zoneinfo import ZoneInfo
DAY=['一','二','三','四','五','六','日']
DAYNAME={'一':'週一','二':'週二','三':'週三','四':'週四','五':'週五','六':'週六','日':'週日'}

def main():
    webhook=os.getenv('DISCORD_WEBHOOK_URL','').strip()
    if not webhook:raise SystemExit('Missing DISCORD_WEBHOOK_URL secret')
    now=datetime.now(ZoneInfo('Asia/Taipei'));day=DAY[now.weekday()]
    if day=='日':print('Sunday: skip');return
    url=webhook+('&wait=true' if '?' in webhook else '?wait=true')
    content=f"📚 今日課表｜{DAYNAME[day]}\n📅 {now:%Y/%m/%d}\n🐸 青蛙版課表圖"
    with open('schedule/output/today.png','rb') as f:
        r=requests.post(url,data={'payload_json':json.dumps({'content':content},ensure_ascii=False)},files={'files[0]':('today.png',f,'image/png')},timeout=60)
    r.raise_for_status();msg=r.json()
    os.makedirs('schedule/.state',exist_ok=True)
    with open('schedule/.state/last_message.json','w',encoding='utf-8') as f:json.dump({'message_id':msg['id'],'sent_at':now.isoformat(),'date':now.strftime('%Y/%m/%d')},f,ensure_ascii=False,indent=2)
    print('Sent Discord message',msg['id'])
if __name__=='__main__':main()
