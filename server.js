const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);

// 修改這裡：加入 cors 設定
const io = new Server(server, {
    cors: {
        origin: "*",  // 允許所有來源連線 (包含 GitHub Pages)
        methods: ["GET", "POST"]
    }
});

// 託管靜態檔案
app.use(express.static(path.join(__dirname, '/')));

// 房間狀態管理
let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('✅ 有使用者連線了:', socket.id);

    // 處理配對邏輯
    socket.on('find_match', () => {
        console.log(`🔎 使用者 ${socket.id} 正在尋找對手...`);
        if (waitingPlayer) {
            // 配對成功
            const roomId = waitingPlayer.id + '#' + socket.id;
            console.log(`🎉 配對成功！房間 ID: ${roomId}`);
            
            const opponent = waitingPlayer;
            waitingPlayer = null;

            socket.join(roomId);
            opponent.join(roomId);

            // 通知雙方
            io.to(roomId).emit('match_found', { roomId: roomId });
            
            // 讓雙方知道誰是誰（簡單起見，先加入的是 Player 1）
            socket.emit('role_assigned', 'player2');
            opponent.emit('role_assigned', 'player1');
        } else {
            // 等待對手
            console.log(`⏳ 使用者 ${socket.id} 加入等待佇列`);
            waitingPlayer = socket;
            socket.emit('waiting_for_opponent');
        }
    });

    // 處理出題
    socket.on('send_question', (data) => {
        console.log(`📩 收到題目 (房間 ${data.roomId}): ${data.question}`);
        // data 包含 roomId 和 questionContent
        socket.to(data.roomId).emit('receive_question', {
            question: data.question
        });
    });

    // 處理回答 (這裡僅轉發結果，具體判定可在前端或後端做)
    socket.on('send_answer', (data) => {
        console.log(`🤔 收到回答 (房間 ${data.roomId}): ${data.answer} (結果: ${data.isCorrect})`);
        socket.to(data.roomId).emit('opponent_answer', {
            answer: data.answer,
            isCorrect: data.isCorrect // 假設前端判定完傳過來，或後端判定
        });
    });

    socket.on('disconnect', () => {
        console.log('❌ 使用者斷線:', socket.id);
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        // 通知房間其他人對手離開
        // 實際應用需要紀錄 socket 所在的房間
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
