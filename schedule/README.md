# 青蛙課表系統

已完成：
- `schedule/index.html`：網站課表預覽，週一到週六切換。
- `schedule/data/schedule.json`：目前 8 人課表資料。
- `schedule/scripts/sync_schedule.py`：從 OneDrive `課表.xlsx` 同步最新內容。
- `schedule/scripts/render_schedule.py`：用 Chromium 將網站版型輸出成 `schedule/output/today.png`。
- `schedule/scripts/send_discord.py`：將 PNG 以真正 Discord 圖片附件發送。
- `schedule/scripts/cleanup_discord.py`：刪除前一次 webhook 發出的課表訊息。

## 自動化需要的 GitHub Secrets

在 Repository → Settings → Secrets and variables → Actions → New repository secret 新增：

- `ONEDRIVE_XLSX_URL`：`課表.xlsx` 的直接下載網址。
- `DISCORD_WEBHOOK_URL`：Discord「📢課程公告」頻道的 Webhook URL。

## 建議排程

- 07:00 Asia/Taipei：同步 Excel → 產生青蛙課表 PNG → Discord 上傳附件 → 更新網站資料。
- 00:00 Asia/Taipei：執行 `cleanup_discord.py`，刪除上一則自動課表。

GitHub Actions 使用 UTC，因此 07:00 台北 = 前一日 23:00 UTC；00:00 台北 = 16:00 UTC。

> 注意：Webhook URL 與 OneDrive 下載網址都不要寫進公開程式碼，只放 GitHub Secrets。
