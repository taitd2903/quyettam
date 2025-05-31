import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { io } from 'socket.io-client';
import scoreData from './tinhdiem.json';
import { Table } from 'antd';
import { Link } from "react-router-dom";
import { Form, Space, Input, Select, InputNumber, Button, Card, Typography, Row, Col, Divider } from 'antd';
import * as XLSX from "xlsx";
import './App.css'; 
const { Title, Text } = Typography;
const { Option } = Select;
const socket = io("http://localhost:4000");
const testNames = [
  "Chạy 10m xuất phát cao (giây)",
  "Chạy luồn cọc zic-zac (giây)",
  "Di chuyển ngang 10m (giây)",
  "Nhảy lò cò xa nhất (mét)",
  "Bật xa tại chỗ bằng hai chân (cm)",
  "Giữ thăng bằng bằng một chân (giây)",
  "Bò bằng tay và chân theo đường zic-zac (giây)",
  "Đập và bắt bóng bằng hai tay trong 15 giây (số lần)",
  "Ném túi cát bằng tay thuận (cm)",
  "Tung bóng vào xô bằng hai tay (5 lần thử – số lần vào)"
];

const Chamdiem = () => {
  const [gender, setGender] = useState('nam');
  const [age, setAge] = useState(4);
  const [results, setResults] = useState({});
  const [scores, setScores] = useState({});
  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');
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
      organization,
      gender,
      age,
      results: { ...results },
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
    <div style={{ padding: '0px', maxWidth: 1440, margin: 'auto' }}>
      <Card >
        <div style={{ textAlign: 'center', marginTop: '0px' }}>
          <Title level={3}>
            TIÊU CHUẨN ĐÁNH GIÁ KỸ NĂNG VẬN ĐỘNG CHO TRẺ 4-5 TUỔI
          </Title>
        </div>

        <Form layout="vertical">
  <Row gutter={16}>
  <Col span={12}>
    <Form.Item label="Tên người thi">
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nhập tên người thi"
      />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item label="Tên đơn vị">
      <Input
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="Nhập tên đơn vị"
      />
    </Form.Item>
  </Col>
</Row>

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

          

          <Title level={3}>Nhập thời gian hoàn thành (giây):</Title>
          {<Row gutter={[16, 8]}>
            {[...Array(10)].map((_, i) => {
              const test = i + 1;
              return (
                <Col xs={4} key={test}>
                  <Form.Item
                    label={
                      <div style={{
                        whiteSpace: 'normal',
                        height: 48,
                        overflow: 'hidden',
                        fontSize: 13,
                        lineHeight: '16px',
                        textAlign: 'center'
                      }}>
                        Bài {test} – {testNames[test - 1]}
                      </div>
                    }
                    style={{ marginBottom: 12 }}
                  >
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

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Text >Nguồn trích dẫn từ luận án tiến sĩ “Xây dựng chương trình phổ cập môn Taekwondo phát triển kỹ năng vận động cho trẻ 4 - 5 tuổi các trường mầm non dân lập trên địa bàn thành phố Hà Nội”
          <br /> Bùi Văn Quyết, Email: buivanquyet@hpu2.edu.vn , Sđt: 0338157313</Text>
      </div>
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
    fetch("http://localhost:4000/api/scores")
      .then(res => res.json())
      .then(setScoresData)
      .catch(console.error);
    socket.on("scoresUpdated", (updatedScores) => {
      setScoresData(updatedScores);
    });

    // Cleanup khi component unmount
    return () => {
      socket.off("scoresUpdated");
    };
  }, []);
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
    {
      title: "Đơn vị",
      dataIndex: "organization",
      key: "organization",
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
  const handleExportExcel = () => {
    const exportData = filteredData.map((user) => {
      const row = {
        Username: user.username,
        "Tên đơn vị": user.organization || "",
        "Giới tính": user.gender,
        Tuổi: user.age,
        "Tổng điểm": user.totalScore,
        "Xếp hạng": getRanking(user.totalScore),
      };
      for (let i = 1; i <= 10; i++) {
        const time = user.results[i] ?? "";
        const score = user.scores[i] ?? "";
        row[`Bài ${i}`] = `${time} giây / ${score} điểm`;
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thống kê điểm");
    XLSX.writeFile(wb, "ThongKeDiem.xlsx");
  };

  return (
    <div style={{
        padding: "20px",
    height: "100vh",           
    backgroundImage: "url('Logo.png')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center",
    backgroundSize: "contain",
    zIndex: 1,
    }}>
      <h2>Thống kê Điểm</h2>
      <Space style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div>
          <Link to="/">
            <Button style={{ marginRight: "10px" }}>Chấm điểm</Button>
          </Link>
          <Button onClick={handleResetScores} type="primary" danger>
            Reset tổng điểm
          </Button>

          <Button onClick={handleSortByScore} type="default" style={{ marginLeft: "10px" }}>
            Sắp xếp từ cao xuống thấp
          </Button>
        </div>
        <Input
          placeholder="Tìm kiếm theo tên"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </Space>
      <Button onClick={handleExportExcel} type="primary" style={{ marginBottom: "16px" }}>
        Xuất Excel
      </Button>
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
