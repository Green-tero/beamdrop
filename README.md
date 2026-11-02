# BeamDrop

[English](README.md) · [فارسی](README.fa.md)

A no-nonsense local peer-to-peer file and text sharing tool running in your browser. No accounts, no cloud uploads, no native apps to install.

Built with WebRTC data channels for direct device-to-device transfers and a minimal Node.js WebSocket signaling server to help devices find each other on the same network.

![BeamDrop Screenshot](https://raw.githubusercontent.com/Green-tero/beamdrop/main/client/public/preview.png)

---

## Why I Built This

I switch between Linux, Windows, macOS, and an Android phone daily. AirDrop is great if you live entirely inside Apple's walled garden, but the moment you want to push a 1.5GB screen capture from a Windows desktop to an iPad or pull logs from a Linux server to an Android phone, your options get annoying fast:

- Messaging apps compress files or cap sizes.
- Cloud drives (Google Drive, Dropbox) waste upstream internet bandwidth uploading files only to download them right back down to a device sitting two feet away.
- Local Samba / SMB shares take configuration and often fail behind guest Wi-Fi isolation.

BeamDrop was born out of that frustration. You open the web page on two devices on the same Wi-Fi, drop the file, and it streams straight across your local router at whatever throughput your Wi-Fi can handle.

---

## Features

- **Direct P2P transfers:** Files and clipboard snippets travel directly over encrypted WebRTC data channels (`RTCDataChannel`).
- **Zero server storage:** The backend signaling server only acts as a matchmaker. It never touches, buffers, or inspects your payload.
- **64KB chunking with backpressure control:** Large files (tested up to multi-gigabyte ISOs) are sliced into 64KB chunks and throttled against browser SCTP buffer limits (`bufferedAmountLowThreshold`) to prevent tab crashes.
- **Auto-discovery by IP / Subnet:** Discovered devices on the same public or local subnet IP appear automatically without room codes or pairing rituals.
- **Bilingual UI (English & فارسی):** Full right-to-left (RTL) layout support and instant language switcher saved to your local storage.
- **Instant text & clipboard sharing:** Quick monospace modal for passing passwords, URLs, or command snippets between devices.
- **Subtle audio chimes:** Native Web Audio API synthesized chimes when a transfer finishes or a message arrives (zero external audio files).

---

## How It Works Under the Hood

### 1. Peer Discovery & Signaling (WebSockets)
```
[ Device A ]                                     [ Device B ]
     │                                                │
     ├─── Connect WebSocket ──► [ Signaling ] ◄───────┤
     │    (extracts IP hash)    [  Server   ]         │
     │                                                │
     ├─── WebRTC Offer ───────► Forwarded ───────────►│
     │◄── WebRTC Answer ◄────── Forwarded ────────────┤
     │                                                │
     ├─── ICE Candidates ─────► Forwarded ───────────►│
     │                                                │
     ▼                                                ▼
     ════════════ Direct Encrypted DataChannel ════════
                    (Files / Text Messages)
```

1. Each client connects to `ws://` (or `wss://` in production).
2. The server inspects the incoming request's remote IP (or `x-forwarded-for` header), hashes it, and assigns peers to that IP's room. (Localhost and loopback IPs are grouped into a `local-dev` room so you can test across browser tabs).
3. The server assigns a random alias (e.g. *Crimson Falcon*, *Silent Koala*) and parses the User-Agent to determine whether the peer is a Desktop, Phone, or Tablet.
4. Clients exchange SDP offers/answers and ICE candidates through the WebSocket. Once the peer connection connects, the signaling server's job is done.

### 2. The 64KB Chunking & Backpressure Problem
WebRTC data channels are built on SCTP. If you try to pass an entire 500MB `Blob` or `ArrayBuffer` directly to `dataChannel.send()`, the browser tries to buffer the entire file in memory before chunking it. In Chrome or Safari, this immediately throws an `OperationError` or crashes the tab.

To solve this:
1. Files are sliced using `file.slice()` into **64KB chunks** (`65,536` bytes), which fits comfortably within standard SCTP MTU guidelines.
2. The sender monitors `channel.bufferedAmount`. If the buffer exceeds **512KB**, the sender loop pauses:
   ```ts
   if (channel.bufferedAmount > BUFFER_THRESHOLD) {
     await new Promise<void>((resolve) => {
       const onLow = () => {
         channel.removeEventListener('bufferedamountlow', onLow);
         resolve();
       };
       channel.addEventListener('bufferedamountlow', onLow);
     });
   }
   ```
3. The receiver collects chunks in memory, updates progress, and when the byte count matches the header metadata, constructs a single `Blob` and triggers the download prompt.

---

## Tech Stack & Compatibility

- **Backend:** Node.js, Express, `ws` (native WebSocket, no heavy socket.io bloat), TypeScript.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide icons.
- **Node.js Compatibility:** Tested on Node.js **v20.x**, **v22.x**, and **v26.x** (ESM native).
- **Browsers:** Modern Chrome, Firefox, Safari (iOS 15+), Edge.

---

## Getting Started

### Prerequisites

- Node.js 20, 22, or 26 installed
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/Green-tero/beamdrop.git
cd beamdrop
npm install
```

### 2. Run in Development

Open two terminal tabs:

**Terminal 1 (Signaling server):**
```bash
cd server
npm run dev
```
Server starts on `http://localhost:3000`.

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
Vite dev server starts on `http://localhost:5173`.

Now open `http://localhost:5173` in two separate browser windows (or an incognito tab) to watch them discover each other and test sending files.

---

## Running with Docker

A multi-stage Docker build is included that compiles the frontend and serves both the static UI and the WebSocket signaling server through a single container.

```bash
docker compose up -d --build
```

Then visit `http://localhost:3000`.

To view logs or stop:
```bash
docker compose logs -f
docker compose down
```

---

## Project Structure

```text
beamdrop/
├── client/
│   ├── src/
│   │   ├── components/      # Radar, peer cards, modals, bars
│   │   ├── hooks/           # useWebRTC, useSignaling
│   │   ├── i18n/            # English and Persian translations + RTL context
│   │   ├── types/           # Client-side data contracts
│   │   ├── utils/           # Chunking, byte formatting, synthesized audio
│   │   ├── App.tsx          # Root view coordinator
│   │   └── main.tsx         # Mounts React tree with I18nProvider
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── utils/           # Name generator, UA parser
│   │   ├── index.ts         # Express & WebSocket server
│   │   ├── rooms.ts         # Room management and signal routing
│   │   └── types.ts         # Signaling contracts
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## Contributing & License

Contributions, bug reports, and ideas are welcome. Found a WebRTC edge case on a weird network setup? Feel free to open an issue or PR.

Distributed under the [MIT License](LICENSE).
