# BeamDrop

A lightweight, peer-to-peer file and text sharing web application built for local networks, inspired by Snapdrop and PairDrop.

BeamDrop lets you send files of any size and share clipboard text directly between phones, laptops, and tablets on the same Wi-Fi without uploading anything to a third-party server.

---

## Why I Built This

I often find myself needing to quickly move a 2GB screen recording from my desktop to my phone, or send a snippet of text or link across machines without having to email myself, set up local SMB network shares, or upload sensitive documents to cloud drives.

AirDrop is great, but only works within the Apple ecosystem. Existing web alternatives often rely on heavy frameworks or third-party cloud services. I wanted something dead simple, self-hostable, fast, and completely private that runs directly in any modern web browser.

---

## How It Works Under the Hood

### 1. Peer Discovery & Signaling (WebSockets)
- When a device opens BeamDrop, it connects to a lightweight Node.js signaling server over a native WebSocket connection (`ws`).
- The server checks the client's public IP (or local subnet). All devices sharing the same IP are grouped into the same virtual "room". In local development mode, loopback IPs automatically group into a shared room so you can test across tabs or windows.
- The server assigns each peer a friendly, memorable alias (like `Crimson Falcon` or `Silent Koala`) and parses the User-Agent header to detect OS and device type.
- The signaling server only brokers the initial WebRTC handshake (Session Description Protocol `offer` / `answer` and ICE candidate exchanges). Once the connection is established, all data flows directly peer-to-peer.

### 2. P2P Data Channels & Chunking (WebRTC)
- Transfers run over an ordered `RTCDataChannel` using SCTP, which provides end-to-end encryption via DTLS.
- **Why chunking is necessary:** Attempting to pass a large file (e.g. 500MB) directly to `RTCDataChannel.send()` will immediately overflow the browser's internal SCTP queue and cause the channel to crash or drop packets.
- **The 64KB sweet spot:** BeamDrop slices files into 64KB chunks (`65,536` bytes), which aligns with the SCTP maximum packet threshold.
- **Backpressure handling:** To prevent memory bloat during high-speed transfers, the sending loop monitors `channel.bufferedAmount`. If the buffer exceeds 512KB, transmission pauses and waits for the browser's `bufferedamountlow` event before continuing.
- **Reassembly:** The receiver collects incoming `ArrayBuffer` chunks in memory, tracks real-time throughput and progress, and triggers an automatic browser download as soon as the final chunk arrives.

---

## Tech Stack

- **Signaling Server:** Node.js, TypeScript, Express, `ws`
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide icons
- **Protocols:** WebRTC (`RTCPeerConnection`, `RTCDataChannel`), WebSockets
- **Containerization:** Docker (multi-stage alpine build), Docker Compose

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node 20 and Node 22)
- npm 9+

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Green-tero/beamdrop.git
   cd beamdrop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the signaling server:**
   ```bash
   cd server
   npm run dev
   ```
   The signaling server will listen on `http://localhost:3000`.

4. **In a separate terminal, start the frontend:**
   ```bash
   cd client
   npm run dev
   ```
   Open `http://localhost:5173` in two different browser tabs (or on devices connected to the same network). They will discover each other automatically.

---

## Running with Docker

A multi-stage Docker build is provided that compiles the React client and serves it directly alongside the WebSocket signaling server in a single container.

```bash
# Build and run with docker-compose
docker compose up -d --build
```

The application will be available at `http://localhost:3000`.

To stop the container:
```bash
docker compose down
```

---

## Project Structure

```text
beamdrop/
├── client/
│   ├── src/
│   │   ├── components/      # UI components (radar, peer cards, modals)
│   │   ├── hooks/           # useSignaling and useWebRTC hooks
│   │   ├── types/           # Shared TypeScript interfaces
│   │   ├── utils/           # File chunker and byte formatters
│   │   ├── App.tsx          # Main application coordinator
│   │   └── main.tsx         # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── utils/           # Name generator and User-Agent parser
│   │   ├── index.ts         # Express server & WebSocket connection handler
│   │   ├── rooms.ts         # Subnet room management and broadcasting
│   │   └── types.ts         # Server-side TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## License

MIT License. Feel free to use this code for personal projects or learning WebRTC.
