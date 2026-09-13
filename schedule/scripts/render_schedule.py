import os,threading,time
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from datetime import datetime
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright
DAY=['一','二','三','四','五','六','日']

def serve():
    httpd=ThreadingHTTPServer(('127.0.0.1',8000),SimpleHTTPRequestHandler)
    threading.Thread(target=httpd.serve_forever,daemon=True).start();return httpd

def main():
    os.makedirs('schedule/output',exist_ok=True)
    day=DAY[datetime.now(ZoneInfo('Asia/Taipei')).weekday()]
    if day=='日':raise SystemExit('Sunday: no class image generated')
    httpd=serve();time.sleep(.5)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page(viewport={'width':1180,'height':2200},device_scale_factor=1)
        page.goto(f'http://127.0.0.1:8000/schedule/?capture=1&day={day}',wait_until='networkidle')
        page.wait_for_function('window.__scheduleReady === true')
        card=page.locator('#capture-card')
        card.screenshot(path='schedule/output/today.png')
        browser.close()
    httpd.shutdown();print('Rendered schedule/output/today.png')
if __name__=='__main__':main()
