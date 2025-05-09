const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
// Route để lấy dữ liệu điểm từ file scores.json
app.get("/api/scores", (req, res) => {
  res.json(scores); // Trả về toàn bộ dữ liệu từ file scores.json
});

const filePath = path.join(__dirname, "scores.json");

// Đọc dữ liệu từ file scores.json
const readScoresFromFile = () => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8"); // Nếu file không tồn tại, tạo file mới với dữ liệu là mảng trống
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    // Kiểm tra nếu dữ liệu không phải là mảng thì trả về mảng trống
    if (!Array.isArray(data)) {
      console.error("Dữ liệu trong file không phải là mảng. Tạo lại file trống.");
      return [];
    }
    return data;
  } catch (err) {
    console.error("Error parsing JSON from file:", err);
    fs.writeFileSync(filePath, "[]", "utf8"); // Nếu lỗi parse JSON, tạo lại file trống
    return [];
  }
};

// Ghi dữ liệu vào file scores.json
const writeScoresToFile = (scores) => {
  fs.writeFileSync(filePath, JSON.stringify(scores, null, 2), "utf8");
};

let scores = readScoresFromFile();

// Cài đặt sự kiện kết nối từ client
io.on("connection", (socket) => {
  console.log("A user connected");

  // Lắng nghe sự kiện gửi dữ liệu người dùng và lưu vào file scores.json
  socket.on("saveUserData", (userData) => {
    scores.push(userData);
    writeScoresToFile(scores);

    // Tính tổng điểm cho user
    const totalScore = Object.values(userData.scores).reduce(
      (acc, val) => acc + (typeof val === "number" ? val : 0),
      0
    );

    console.log("User data saved:", userData);
    console.log("Total score:", totalScore);

    // Gửi lại thông báo và điểm số cho client
    socket.emit("userDataSaved", {
      message: "Dữ liệu đã được lưu thành công!",
      totalScore: totalScore, // Trả về tổng điểm
    });
  });

  // Xử lý sự kiện ngắt kết nối của người dùng
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Cấu hình route mặc định
app.get("/", (req, res) => {
  res.send("🧮 Scoring Server is Running!");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🧮 Scoring Server chạy tại http://localhost:${PORT}`);
});
app.post("/api/reset-scores", (req, res) => {
  scores = [];  // Xóa sạch danh sách người dùng
  writeScoresToFile(scores);  // Ghi file rỗng []

  res.json({ message: "Đã xóa toàn bộ danh sách người dùng và điểm!" });
});
