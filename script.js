// 初始化 Socket
const socket = io();
let myRoomId = null;
let myRole = null;

const statusDiv = document.getElementById('status');
const btnFindMatch = document.getElementById('btn-find-match');
const questionArea = document.getElementById('question-area');
const btnSendQuestion = document.getElementById('btn-send-question');
const questionInput = document.getElementById('my-question');

// 配對按鈕事件
btnFindMatch.addEventListener('click', () => {
    statusDiv.innerText = "正在尋找對手...";
    socket.emit('find_match');
    btnFindMatch.disabled = true;
});

// 監聽配對狀態
socket.on('waiting_for_opponent', () => {
    statusDiv.innerText = "等待其他玩家加入...";
});

socket.on('match_found', (data) => {
    myRoomId = data.roomId;
    statusDiv.innerText = "配對成功！請互相出題。";
    questionArea.style.display = 'block';
});

socket.on('role_assigned', (role) => {
    myRole = role;
    console.log("我是: " + role);
});

// 送出題目
btnSendQuestion.addEventListener('click', () => {
    const q = questionInput.value;
    if (q.length === 4) { // 假設簡化驗證
        socket.emit('send_question', { roomId: myRoomId, question: q });
        statusDiv.innerText = "題目已送出，等待對手出題...";
        btnSendQuestion.disabled = true;
    } else {
        alert("請輸入有效的題目");
    }
});

// 收到題目
socket.on('receive_question', (data) => {
    // 這裡調用您現有的遊戲邏輯來設定答案
    // 例如: setAnswer(data.question); 
    console.log("收到對手題目: " + data.question); // 實際遊玩時不要 log 出來作弊
    statusDiv.innerText = "收到對手題目！遊戲開始！";
    
    // 如果您原本有 initGame() 或是設定謎底的函數，在這裡呼叫
    // ...existing code...
    // startGameWithAnswer(data.question); 
});

socket.on('opponent_answer', (data) => {
    // 顯示對手的進度
    const log = document.getElementById('battle-log');
    log.innerHTML += `<p>對手猜測: ${data.answer} (結果: ${data.isCorrect ? '正確' : '錯誤'})</p>`;
});

// ...existing code...