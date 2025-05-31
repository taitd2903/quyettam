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

const filePath = path.join(__dirname, "scores.json");

const readScoresFromFile = () => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data)) {
      console.error("Dữ liệu trong file không phải là mảng. Tạo lại file trống.");
      return [];
    }
    return data;
  } catch (err) {
    console.error("Error parsing JSON from file:", err);
    fs.writeFileSync(filePath, "[]", "utf8");
    return [];
  }
};

const writeScoresToFile = (scores) => {
  fs.writeFileSync(filePath, JSON.stringify(scores, null, 2), "utf8");
};

let scores = readScoresFromFile();

// REST API lấy điểm
app.get("/api/scores", (req, res) => {
  res.json(scores);
});

// Reset điểm
app.post("/api/reset-scores", (req, res) => {
  scores = [];
  writeScoresToFile(scores);
  io.emit("scoresUpdated", scores);
  res.json({ message: "Đã xóa toàn bộ danh sách người dùng và điểm!" });
});
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("saveUserData", (userData) => {
    scores.push(userData);
    writeScoresToFile(scores);

    const totalScore = Object.values(userData.scores).reduce(
      (acc, val) => acc + (typeof val === "number" ? val : 0),
      0
    );


    socket.emit("userDataSaved", {
      message: "Dữ liệu đã được lưu thành công!",
      totalScore,
    });

    // Gửi điểm cập nhật cho tất cả client để đồng bộ
    io.emit("scoresUpdated", scores);

    console.log("User data saved:", userData);
    console.log("Total score:", totalScore);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("🧮 Scoring Server is Running!");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🧮 Scoring Server chạy tại http://localhost:${PORT}`);
});