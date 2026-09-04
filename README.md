# HTTP Client — Web Version (Part 1)

เวอร์ชันเว็บของ HTTP Client Application ตามข้อกำหนดในส่วนที่ 1 ออกแบบให้ deploy บน Render ได้จริง (Docker)

## สถาปัตยกรรม

- **Backend** (`server.js`, Node.js/Express) — รับพารามิเตอร์ scheme/host/uri จากหน้าเว็บ แล้วเป็นคนส่ง HTTP/HTTPS request จริงไปยัง server ปลายทาง (ทำฝั่ง server เพื่อเลี่ยงข้อจำกัด CORS ของ browser ที่ block การยิง request ข้าม origin ไปยัง host ใดก็ได้) จากนั้นส่ง status, headers และ body ดิบ (base64) กลับมาให้หน้าเว็บ
- **Frontend** (`public/`) — รับ input Server IP/Host, HTTP/HTTPS, URI แล้วแสดงผล response 3 แบบ ตรงตามโจทย์:
  1. **Text** — response body
  2. **Hexadecimal** — hex dump (offset / hex / ascii)
  3. **Web Browser** — render HTML จริงใน `<iframe sandbox>` (เทียบเท่า WebBrowser Control ในโจทย์ ไม่ใช่แค่แสดง source code)

## รันในเครื่องตัวเอง

```bash
npm install
npm start
# เปิด http://localhost:3000
```

## Deploy บน Render

1. Push โค้ดทั้งหมด (รวม `Dockerfile` ที่ root ของ repo) ขึ้น GitHub
2. Render → New → Web Service → เลือก repo นี้
3. Language/Environment: **Docker** (Render จะเจอ `Dockerfile` เองที่ root)
4. ไม่ต้องตั้งค่า Build/Start Command เพิ่ม เพราะกำหนดใน Dockerfile แล้ว
5. Render จะกำหนด environment variable `PORT` ให้อัตโนมัติ — โค้ดอ่านค่านี้อยู่แล้ว (`process.env.PORT`)
6. กด Deploy

> สาเหตุที่ deploy ครั้งก่อนพัง (`failed to read dockerfile: open Dockerfile: no such file or directory`) คือ repo เดิมมีแต่โปรเจกต์ WinForms (C#/.NET Desktop) ซึ่งไม่มี Dockerfile และไม่สามารถรันแบบ headless บน Linux container ได้เลย — โปรเจกต์นี้เขียนขึ้นใหม่ทั้งหมดให้เป็นเว็บแอปโดยเฉพาะ

## หมายเหตุเรื่อง deliverables

- **Source Code** — ครบใน repo นี้
- **Screenshot การทำงาน** — หลัง deploy สำเร็จ เปิด URL ที่ Render ให้มา แล้ว capture หน้าจอทั้ง 3 แท็บเอง
