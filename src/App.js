import React, { useEffect ,useState } from "react";
import { Routes, Route } from "react-router-dom";
import { io } from 'socket.io-client';
import scoreData from './tinhdiem.json';
import { Table } from 'antd';
const socket = io("http://localhost:4000"); // Đảm bảo kết nối với server

const Chamdiem = () => {
  const [gender, setGender] = useState('nam');
  const [age, setAge] = useState(4);
  const [results, setResults] = useState({});
  const [scores, setScores] = useState({});
  const [username, setUsername] = useState('');

  const handleChange = (test, value) => {
    const newResults = {
      ...results,
      [test]: parseFloat(value),
    };
    setResults(newResults);

    const newScores = {};
    for (const test in newResults) {
      const score = getScore(gender, age, test, newResults[test]);
      newScores[test] = score !== null ? score : 'Không hợp lệ';
    }
    setScores(newScores);
  };

  const getScore = (gender, age, testNum, value) => {
    const testRanges = scoreData[gender]?.[age]?.[testNum];
    if (!testRanges) return null;

    for (const range of testRanges) {
      if (range.min !== undefined && range.max !== undefined) {
        if (value >= range.min && value <= range.max) return range.score;
      } else if (range.min !== undefined) {
        if (value >= range.min) return range.score;
      } else if (range.max !== undefined) {
        if (value <= range.max) return range.score;
      }
    }
    return null;
  };

  const handleSaveData = () => {
    if (!username.trim()) {
      alert("Vui lòng nhập tên người dùng!");
      return;
    }
  
    const scoreValues = Object.values(scores);
  
    if (scoreValues.length < 10) {
      alert("Vui lòng nhập đủ điểm cho 10 bài!");
      return;
    }
  
    const hasInvalidScore = scoreValues.some(
      (val) => val === null || val === "" || isNaN(val)
    );
  
    if (hasInvalidScore) {
      alert("Tất cả điểm phải là số hợp lệ!");
      return;
    }
  
    const totalScore = scoreValues.reduce((acc, val) => acc + Number(val), 0);
  
    const userData = {
      username,
      gender,
      age,
      results: { ...results },  // Giả sử bạn có phần lưu kết quả gốc
      scores: { ...scores },
      totalScore,
    };
  
    socket.emit("saveUserData", userData);
    alert("Dữ liệu đã được lưu!");
  };
  

  return (
    <div style={{ padding: '20px' }}>
      <h2>Chấm điểm KNVĐ</h2>

      <div>
        <label>
          Tên người dùng:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên người dùng"
            required
          />
        </label>
      </div>

      <div>
        <label>
          Giới tính:
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Tuổi:
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value))}
            min={4}
            max={5}
          />
        </label>
      </div>

      <h3>Nhập thời gian hoàn thành (giây):</h3>
      {[...Array(10)].map((_, i) => {
        const test = i + 1;
        return (
          <div key={test}>
            <label>
              Bài {test}:
              <input
                type="number"
                step="0.01"
                onChange={(e) => handleChange(test, e.target.value)}
              />
            </label>
          </div>
        );
      })}

      {Object.keys(scores).length > 0 && (
        <div>
          <h3>Kết quả:</h3>
          <ul>
            {Object.entries(scores).map(([test, score]) => (
              <li key={test}>
                Bài {test}: {score}
              </li>
            ))}
          </ul>
          <strong>
            Tổng điểm: {Object.values(scores).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0)}
          </strong>
        </div>
      )}

      <button onClick={handleSaveData}>Lưu dữ liệu</button>
    </div>
  );
};
const Thongke = () => {
  const [scoresData, setScoresData] = useState([]);
  const [sorted, setSorted] = useState(false);

  const fetchScores = () => {
    fetch("http://localhost:4000/api/scores")
      .then((response) => response.json())
      .then((data) => {
        setScoresData(data);
      })
      .catch((error) => {
        console.error("Error fetching scores:", error);
      });
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleResetScores = () => {
    fetch("http://localhost:4000/api/reset-scores", { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        fetchScores();
      })
      .catch((error) => {
        console.error("Error resetting scores:", error);
      });
  };

  const handleSortByScore = () => {
    const sortedData = [...scoresData].sort((a, b) => b.totalScore - a.totalScore);
    setScoresData(sortedData);
    setSorted(true);
  };

  return (
    <div>
      <h2>Thống kê Điểm</h2>
      <button onClick={handleResetScores} style={{ marginRight: "10px" }}>
        Reset tổng điểm
      </button>
      <button onClick={handleSortByScore}>
        Sắp xếp từ cao xuống thấp
      </button>

      {scoresData.length > 0 ? (
        <table border="1" cellPadding="8" style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Giới tính</th>
              <th>Tuổi</th>
              <th>Tổng điểm</th>
            </tr>
          </thead>
          <tbody>
            {scoresData.map((userData, index) => (
              <tr key={index}>
                <td>{userData.username}</td>
                <td>{userData.gender}</td>
                <td>{userData.age}</td>
                <td>{userData.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Chưa có dữ liệu thống kê.</p>
      )}
    </div>
  );
};


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Chamdiem />} />
      <Route path="/thongke" element={<Thongke />} />
    </Routes>
  );
};

export default App;
