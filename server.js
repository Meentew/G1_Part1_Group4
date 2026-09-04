const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// งานที่ 1.1: ส่ง HTTP Request แทนผู้ใช้ (server-side) แล้วคืน
// status / headers / body ดิบ (base64) กลับไปให้หน้าเว็บแสดงผลเป็น
// Text, Hexadecimal และ Render ใน "WebBrowser" (iframe)
app.get('/api/proxy', (req, res) => {
  const { scheme, host, uri } = req.query;

  if (!host) {
    return res.status(400).json({ error: 'กรุณาระบุ Server IP / Host' });
  }

  const isHttps = scheme === 'https';
  const transport = isHttps ? https : http;

  let uriPath = uri && uri.length > 0 ? uri : '/';
  if (!uriPath.startsWith('/')) {
    uriPath = '/' + uriPath;
  }

  const [hostname, port] = String(host).split(':');

  const options = {
    hostname,
    port: port || (isHttps ? 443 : 80),
    path: uriPath,
    method: 'GET',
    rejectUnauthorized: false, // อนุญาต self-signed cert สำหรับทดสอบใน Lab
    timeout: 15000,
    headers: { 'User-Agent': 'Group-HTTP-Client/1.0' },
  };

  const outgoing = transport.request(options, (upstream) => {
    const chunks = [];
    upstream.on('data', (chunk) => chunks.push(chunk));
    upstream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.json({
        status: upstream.statusCode,
        statusText: upstream.statusMessage,
        headers: upstream.headers,
        bodyBase64: buffer.toString('base64'),
      });
    });
  });

  outgoing.on('timeout', () => {
    outgoing.destroy();
    res.status(504).json({ error: 'Request timed out' });
  });

  outgoing.on('error', (err) => {
    res.status(502).json({ error: err.message });
  });

  outgoing.end();
});

app.get('/healthz', (req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`HTTP Client (web) listening on port ${PORT}`);
});
