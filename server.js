const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 託管靜態檔案
app.use(express.static(path.join(__dirname, '/')));

// 房間狀態管理
let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 處理配對邏輯
    socket.on('find_match', () => {
        if (waitingPlayer) {
            // 配對成功
            const roomId = waitingPlayer.id + '#' + socket.id;
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
            waitingPlayer = socket;
            socket.emit('waiting_for_opponent');
        }
    });

    // 處理出題
    socket.on('send_question', (data) => {
        // data 包含 roomId 和 questionContent
        socket.to(data.roomId).emit('receive_question', {
            question: data.question
        });
    });

    // 處理回答 (這裡僅轉發結果，具體判定可在前端或後端做)
    socket.on('send_answer', (data) => {
        socket.to(data.roomId).emit('opponent_answer', {
            answer: data.answer,
            isCorrect: data.isCorrect // 假設前端判定完傳過來，或後端判定
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
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
