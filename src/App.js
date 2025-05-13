import React, { useEffect ,useState } from "react";
import { Routes, Route } from "react-router-dom";
import { io } from 'socket.io-client';
import scoreData from './tinhdiem.json';
import { Table } from 'antd';
import { Link } from "react-router-dom";
import { Form,Space , Input, Select, InputNumber, Button, Card, Typography, Row, Col, Divider } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
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
  useEffect(() => {
  const updatedScores = {};
  for (const test in results) {
    const score = getScore(gender, age, test, results[test]);
    updatedScores[test] = score !== null ? score : 'Không hợp lệ';
  }
  setScores(updatedScores);
}, [gender, age, results]);


return (
  <div style={{ padding: '24px', maxWidth: 800, margin: 'auto' }}>
    <Card bordered>
      <Title level={2}>Chấm điểm KNVĐ</Title>

      <Form layout="vertical">
        <Form.Item label="Tên người thi">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên người thi"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Giới tính">
              <Select value={gender} onChange={(value) => setGender(value)}>
                <Option value="nam">Nam</Option>
                <Option value="nu">Nữ</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Tuổi">
              <InputNumber
                min={4}
                max={5}
                value={age}
                onChange={(value) => setAge(value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Title level={4}>Nhập thời gian hoàn thành (giây):</Title>
        {<Row gutter={[16, 8]}>
  {[...Array(10)].map((_, i) => {
    const test = i + 1;
    return (
      <Col xs={12} sm={8} md={6} lg={4} key={test}>
        <Form.Item label={`Bài ${test}`} style={{ marginBottom: 8 }}>
          <InputNumber
            min={0}
            step={0.01}
            onChange={(value) => handleChange(test, value)}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
    );
  })}
</Row>
}

        {Object.keys(scores).length > 0 && (
          <>
            <Divider />
            <Title level={4}>Kết quả</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>

            {Object.entries(scores).map(([test, score]) => (
              <Text key={test} block>
                Bài {test}: <strong>{score}</strong>
              </Text>
             
            ))}
            <br /> </div>
            <Text strong style={{ fontSize: '16px' }}>
              Tổng điểm:{" "}
              {Object.values(scores).reduce(
                (acc, val) => acc + (typeof val === 'number' ? val : 0),
                0
              )}
            </Text>
          </>
        )}

        <Divider />

     <Row justify="space-between" style={{ width: '100%' }}>
  <Col>
    <Link to="/thongke">
      <Button>Xem thống kê</Button>
    </Link>
  </Col>
  <Col>
    <Button type="primary" onClick={handleSaveData}>
      Lưu dữ liệu
    </Button>
  </Col>
</Row>

      </Form>
    </Card>
  </div>
);

};
const Thongke = () => {
  const [scoresData, setScoresData] = useState([]);
  const [sorted, setSorted] = useState(false);
  const [searchText, setSearchText] = useState("");
  const filteredData = scoresData.filter((userData) =>
    userData.username.toLowerCase().includes(searchText.toLowerCase())
  );
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
 const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Tuổi",
      dataIndex: "age",
      key: "age",
    },
        ...Array.from({ length: 10 }, (_, i) => ({
      title: `Bài kiểm tra ${i + 1}`,
      dataIndex: `result_${i + 1}`,
      key: `result_${i + 1}`,
      render: (_, record) => `${record.results[i + 1]} giây/ ${record.scores[i + 1]} điểm`, // Kết hợp kết quả và điểm
    })),
    {
      title: "Tổng điểm",
      dataIndex: "totalScore",
      key: "totalScore",
    },
      {
      title: "Xếp hạng",
      key: "ranking",
      render: (_, record) => getRanking(record.totalScore),
    },
  ];
    const getRanking = (score) => {
    if (score >= 90) return "Xuất sắc";
    if (score >= 75) return "Tốt";
    if (score >= 50) return "Trung bình";
    if (score >= 30) return "Yếu";
    return "Kém";
  };
  const formattedData = filteredData.map((userData) => ({
    ...userData,
    ...Array.from({ length: 10 }, (_, i) => ({
      [`result_${i + 1}`]: userData.results[i + 1],
      [`score_${i + 1}`]: userData.scores[i + 1],
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
  }));
 return (
    <div style={{ padding: "20px" }}>
      <h2>Thống kê Điểm</h2>
      <Space style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div>
              <Link to="/">
      <Button  style={{ marginRight: "10px" }}>Chấm điểm</Button>
    </Link>
          <Button onClick={handleResetScores} type="primary" danger>
            Reset tổng điểm
          </Button>
       
          <Button onClick={handleSortByScore} type="default" style={{ marginLeft: "10px" }}>
            Sắp xếp từ cao xuống thấp
          </Button>
        </div>
        {/* Ô tìm kiếm nằm bên phải */}
        <Input
          placeholder="Tìm kiếm theo tên"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </Space>
      
      {formattedData.length > 0 ? (
        <Table
          columns={columns}
          dataSource={formattedData}
          rowKey="username"
          bordered
          pagination={false}
        />
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
