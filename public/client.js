const messagesDiv = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const userListUl = document.getElementById('user-list');
const recipientNameSpan = document.getElementById('recipient-name');

const socket = new WebSocket(`ws://${window.location.host}`);

// Variabel untuk menyimpan state
let myId = null;
let myUsername = null;
let currentRecipient = { id: 'broadcast', username: 'Semua Orang' }; // Default: kirim ke semua

socket.onopen = () => console.log('Terhubung ke server WebSocket.');
socket.onclose = () => addMessage('Koneksi terputus dari server.');

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'welcome':
            myId = data.id;
            myUsername = data.username;
            addMessage(`Selamat datang, ${myUsername}!`);
            break;
        case 'user-list':
            updateUserList(data.users);
            break;
        case 'chat-message':
            // Pesan siaran (broadcast)
            addMessage(`${data.sender}: ${data.content}`);
            break;
        case 'direct-message':
            // Pesan pribadi (direct message)
            addMessage(`(Pesan Pribadi) ${data.sender}: ${data.content}`);
            break;
        case 'system-message':
            addMessage(`[SISTEM]: ${data.content}`);
            break;
    }
};

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageContent = messageInput.value;
    if (!messageContent) return;

    if (currentRecipient.id === 'broadcast') {
        // Kirim sebagai pesan siaran (chat biasa)
        socket.send(JSON.stringify({
            type: 'chat-message',
            content: messageContent
        }));
    } else {
        // Kirim sebagai pesan pribadi
        socket.send(JSON.stringify({
            type: 'direct-message',
            content: messageContent,
            recipientId: currentRecipient.id
        }));
        // Tampilkan pesan kita sendiri di layar
        addMessage(`(Pesan Pribadi) Anda -> ${currentRecipient.username}: ${messageContent}`);
    }
    
    messageInput.value = '';
});

function addMessage(message) {
    const p = document.createElement('p');
    p.textContent = message;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateUserList(users) {
    userListUl.innerHTML = ''; // Kosongkan daftar lama
    
    // Tambahkan opsi "Semua Orang" untuk broadcast
    const broadcastLi = document.createElement('li');
    broadcastLi.textContent = 'Semua Orang';
    broadcastLi.style.fontWeight = 'bold';
    broadcastLi.onclick = () => selectRecipient({ id: 'broadcast', username: 'Semua Orang' });
    userListUl.appendChild(broadcastLi);

    users.forEach(user => {
        // Jangan tampilkan diri sendiri di daftar
        if (user.id === myId) return;

        const li = document.createElement('li');
        li.textContent = user.username;
        // Tambahkan event listener untuk memilih penerima
        li.onclick = () => selectRecipient(user);
        userListUl.appendChild(li);
    });
}

function selectRecipient(user) {
    currentRecipient = user;
    recipientNameSpan.textContent = user.username;
    console.log('Penerima diubah menjadi:', user.username);
}