import json,os,requests

def main():
    webhook=os.getenv('DISCORD_WEBHOOK_URL','').strip()
    state='schedule/.state/last_message.json'
    if not webhook:raise SystemExit('Missing DISCORD_WEBHOOK_URL secret')
    if not os.path.exists(state):print('No message state');return
    with open(state,encoding='utf-8') as f:s=json.load(f)
    mid=s.get('message_id')
    if not mid:print('No message id');return
    base=webhook.split('?')[0].rstrip('/')
    r=requests.delete(f'{base}/messages/{mid}',timeout=30)
    if r.status_code not in (204,404):r.raise_for_status()
    with open(state,'w',encoding='utf-8') as f:json.dump({},f)
    print('Deleted/cleared',mid)
if __name__=='__main__':main()
