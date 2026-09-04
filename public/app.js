const hostInput = document.getElementById('host');
const uriInput = document.getElementById('uri');
const sendBtn = document.getElementById('sendBtn');
const spinner = document.getElementById('spinner');
const urlPreview = document.getElementById('urlPreview');
const statusLine = document.getElementById('statusLine');
const statusDot = document.getElementById('statusDot');
const textOutput = document.getElementById('textOutput');
const hexOutput = document.getElementById('hexOutput');
const browserFrame = document.getElementById('browserFrame');
const protoButtons = document.querySelectorAll('.proto-btn');
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

let scheme = 'http';

function currentUrl() {
  let uri = uriInput.value.trim() || '/';
  if (!uri.startsWith('/')) uri = '/' + uri;
  return `${scheme}://${hostInput.value.trim()}${uri}`;
}

function refreshPreview() {
  urlPreview.textContent = currentUrl();
}

protoButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    protoButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    scheme = btn.dataset.value;
    refreshPreview();
  });
});

hostInput.addEventListener('input', refreshPreview);
uriInput.addEventListener('input', refreshPreview);

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    panels.forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToHexDump(bytes) {
  const perLine = 16;
  let out = '';
  for (let i = 0; i < bytes.length; i += perLine) {
    const chunk = bytes.slice(i, i + perLine);
    const offset = i.toString(16).padStart(8, '0').toUpperCase();

    let hexPart = '';
    let asciiPart = '';
    for (let j = 0; j < perLine; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexPart += b.toString(16).padStart(2, '0').toUpperCase() + ' ';
        asciiPart += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
      } else {
        hexPart += '   ';
      }
      if (j === 7) hexPart += ' ';
    }
    out += `${offset}  ${hexPart} ${asciiPart}\n`;
  }
  return out || '(empty body)';
}

// แสดง HTML Response ภายใน "WebBrowser Control" (iframe แบบ sandboxed)
// โดยใช้เนื้อหาจาก response จริงที่ backend ดึงมา ไม่ใช่การ navigate ซ้ำ
function renderInBrowser(html) {
  browserFrame.srcdoc = html;
}

function setStatus(kind, message) {
  statusDot.className = kind;
  statusLine.textContent = message;
}

async function sendRequest() {
  const host = hostInput.value.trim();
  if (!host) {
    setStatus('err', 'กรุณาระบุ Server IP / Host');
    return;
  }

  sendBtn.disabled = true;
  spinner.hidden = false;
  setStatus('busy', 'กำลังส่งคำขอ...');
  textOutput.textContent = '';
  hexOutput.textContent = '';
  renderInBrowser('');

  const params = new URLSearchParams({
    scheme,
    host,
    uri: uriInput.value.trim() || '/',
  });

  try {
    const res = await fetch(`/api/proxy?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const bytes = base64ToBytes(data.bodyBase64);
    const text = new TextDecoder('utf-8').decode(bytes);

    textOutput.textContent = text || '(empty body)';
    hexOutput.textContent = bytesToHexDump(bytes);
    renderInBrowser(text);

    setStatus('ok', `Status: ${data.status} ${data.statusText || ''}  |  ${bytes.length} bytes`);
  } catch (err) {
    setStatus('err', 'เกิดข้อผิดพลาด: ' + err.message);
    textOutput.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message;
    renderInBrowser(`<html><body style="font-family:sans-serif;padding:24px;color:#900">
      <h3>Request failed</h3><p>${err.message}</p></body></html>`);
  } finally {
    sendBtn.disabled = false;
    spinner.hidden = true;
  }
}

sendBtn.addEventListener('click', sendRequest);
refreshPreview();
