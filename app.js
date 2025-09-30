const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

// menggunakan DUA Map untuk manajemen klien yang efisien
const clients = new Map(); // map dari koneksi (ws) -> metadata
const clientsById = new Map(); // map dari id -> koneksi (ws)

function broadcast(message) {
    for (const clientWs of clients.keys()) {
        clientWs.send(JSON.stringify(message));
    }
}

const namaClient = [
    "pisang", "gedang", "nangka", "kates", "jeruk", "semangka",
    "ananas", "bery", "suket", "jamur", "mekar", "bunga", "mayat",
    "muehwehwe", "ayam", "musang", "pepaya", "cempe", "piyik", "gudel"
]
function namai(array, clientId) {
  if (array.length === 0) {
      return clientId;
    }
    
    const indeksAcak = Math.floor(Math.random() * array.length);
    
    return array[indeksAcak];
}

wss.on('connection', (ws) => {
    const clientId = Date.now().toString();

    const metadata = { id: clientId, username: `${namai(namaClient, clientId)}` };
    
    // Simpan di kedua Map
    clients.set(ws, metadata);
    clientsById.set(clientId, ws);

    console.log(`Klien ${metadata.username} terhubung.`);
    
    ws.send(JSON.stringify({ type: 'welcome', ...metadata }));

    broadcast({
        type: 'user-list',
        users: Array.from(clients.values())
    });

    ws.on('message', (messageAsString) => {
        const message = JSON.parse(messageAsString);
        const senderWs = ws;
        const senderMetadata = clients.get(senderWs);

        if (message.type === 'chat-message') {
            // Logika broadcast (ke semua orang) tetap sama
            broadcast({
                type: 'chat-message',
                sender: senderMetadata.username,
                content: message.content
            });
        } 
        // ===============================================
        // LOGIKA BARU UNTUK PESAN PRIBADI
        // ===============================================
        else if (message.type === 'direct-message') {
            const recipientWs = clientsById.get(message.recipientId);

            if (recipientWs) { // Cek apakah penerima masih online
                const dmPayload = {
                    type: 'direct-message',
                    sender: senderMetadata.username,
                    content: message.content
                };
                
                // Kirim pesan hanya ke penerima
                recipientWs.send(JSON.stringify(dmPayload));
                
                // Kirim salinan pesan kembali ke pengirim agar muncul di chatnya juga
                senderWs.send(JSON.stringify(dmPayload));

                console.log(`Pesan pribadi dari ${senderMetadata.username} ke ID ${message.recipientId}`);
            } else {
                // (Opsional) Beri tahu pengirim jika target offline
                senderWs.send(JSON.stringify({
                    type: 'system-message',
                    content: `Pengguna dengan ID ${message.recipientId} tidak ditemukan atau sudah offline.`
                }));
            }
        }
    });

    ws.on('close', () => {
        const disconnectedUser = clients.get(ws);
        clients.delete(ws);
        // Hapus juga dari Map kedua
        clientsById.delete(disconnectedUser.id);
        
        console.log(`Klien ${disconnectedUser.username} terputus.`);
        
        broadcast({
            type: 'user-list',
            users: Array.from(clients.values())
        });
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});