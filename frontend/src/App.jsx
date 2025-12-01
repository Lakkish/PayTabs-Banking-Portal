import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Navbar,
  Nav,
  Badge,
  Alert,
  ButtonGroup,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("banking_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("banking_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("banking_user");
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <NavigationBar user={user} onLogout={handleLogout} />
      <Container fluid className="py-4 bg-light min-vh-100">
        {user.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <CustomerDashboard user={user} />
        )}
      </Container>
    </>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [role, setRole] = useState("customer");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (role === "admin") {
      if (username === "admin" && password === "admin") {
        onLogin({ role: "admin", name: "Super Admin" });
      } else {
        setError("Invalid Admin credentials (try admin/admin)");
      }
    } else {
      if (username === "cust1" && password === "pass") {
        onLogin({
          role: "customer",
          name: "John Doe",
          cardNumber: "4123456789012345",
        });
      } else {
        setError("Invalid Customer credentials (try cust1/pass)");
      }
    }
  };

  return (
    <Container
      fluid
      className="bg-light d-flex align-items-center justify-content-center min-vh-100"
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div
                  className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "60px", height: "60px" }}
                >
                  <i className="fas fa-shield-alt text-white fs-4"></i>
                </div>
                <h2 className="fw-bold">Secure Banking Portal</h2>
                <p className="text-muted">Sign in to manage your finances</p>
              </div>

              <Form onSubmit={handleLogin}>
                <ButtonGroup className="w-100 mb-3">
                  <Button
                    variant={
                      role === "customer" ? "primary" : "outline-primary"
                    }
                    onClick={() => setRole("customer")}
                    className="flex-grow-1"
                  >
                    Customer
                  </Button>
                  <Button
                    variant={role === "admin" ? "primary" : "outline-primary"}
                    onClick={() => setRole("admin")}
                    className="flex-grow-1"
                  >
                    Administrator
                  </Button>
                </ButtonGroup>

                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === "admin" ? "admin" : "cust1"}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                  />
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="d-flex align-items-center">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Button type="submit" variant="primary" className="w-100">
                  Sign In
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

const NavigationBar = ({ user, onLogout }) => {
  return (
    <Navbar bg="white" expand="lg" className="border-bottom shadow-sm">
      <Container>
        <Navbar.Brand className="fw-bold fs-3">
          <i className="fas fa-credit-card text-primary me-2"></i>
          PayTabs<span className="text-primary">Bank</span>
        </Navbar.Brand>

        <Navbar.Collapse className="justify-content-end">
          <Nav className="align-items-center">
            <div className="text-end me-3 d-none d-sm-block">
              <div className="fw-semibold">{user.name}</div>
              <small className="text-muted text-uppercase">{user.role}</small>
            </div>
            <Button variant="outline-secondary" onClick={onLogout}>
              <i className="fas fa-sign-out-alt me-2"></i>
              <span className="d-none d-sm-inline">Sign Out</span>
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

const CustomerDashboard = ({ user }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [type, setType] = useState("topup");
  const [message, setMessage] = useState(null);

  const GATEWAY_URL = "http://localhost:5000";
  const CORE_URL = "http://localhost:5001";

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CORE_URL}/card/${user.cardNumber}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.card.balance);
        setTransactions(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.cardNumber]);

  const handleTransaction = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage(null);

    try {
      const res = await fetch(`${GATEWAY_URL}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: user.cardNumber,
          pin,
          amount: Number(amount),
          type,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        setMessage({
          type: "success",
          text: `Transaction successful! New Balance: $${data.newBalance}`,
        });
        setBalance(data.newBalance);
        setAmount("");
        setPin("");
        fetchData();
      } else {
        setMessage({
          type: "danger",
          text: data.reason || "Transaction Failed",
        });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "System Gateway Unreachable" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container>
      <Row className="g-4">
        <Col md={6}>
          <Card className="bg-primary text-white h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="mb-1 opacity-75">Total Balance</p>
                  <h2 className="fw-bold">${balance.toLocaleString()}</h2>
                </div>
                <div className="bg-white bg-opacity-10 rounded p-2">
                  <i className="fas fa-wallet fs-4"></i>
                </div>
              </div>
              <div className="mt-auto d-flex justify-content-between text-opacity-75">
                <span>{user.name}</span>
                <span className="font-monospace">
                  •••• {user.cardNumber.slice(-4)}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Quick Action</Card.Title>

              <ButtonGroup className="w-100 mb-3">
                <Button
                  variant={type === "topup" ? "primary" : "outline-primary"}
                  onClick={() => setType("topup")}
                  className="flex-grow-1"
                >
                  <i className="fas fa-arrow-up me-2"></i>Top Up
                </Button>
                <Button
                  variant={type === "withdraw" ? "primary" : "outline-primary"}
                  onClick={() => setType("withdraw")}
                  className="flex-grow-1"
                >
                  <i className="fas fa-arrow-down me-2"></i>Withdraw
                </Button>
              </ButtonGroup>

              <Form onSubmit={handleTransaction}>
                <Row className="g-3 mb-3">
                  <Col sm={6}>
                    <Form.Label className="fw-semibold text-uppercase small">
                      Amount
                    </Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <Form.Control
                        type="number"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </Col>
                  <Col sm={6}>
                    <Form.Label className="fw-semibold text-uppercase small">
                      PIN
                    </Form.Label>
                    <Form.Control
                      type="password"
                      maxLength="4"
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                    />
                  </Col>
                </Row>

                {message && (
                  <Alert
                    variant={message.type}
                    className="d-flex align-items-center"
                  >
                    <i
                      className={`fas fa-${
                        message.type === "success"
                          ? "check-circle"
                          : "exclamation-circle"
                      } me-2`}
                    ></i>
                    {message.text}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={processing || !amount || !pin}
                >
                  {processing
                    ? "Processing..."
                    : `Confirm ${type === "topup" ? "Top Up" : "Withdrawal"}`}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-history text-muted me-2"></i>
                Recent Transactions
              </h5>
              <Button variant="outline-secondary" size="sm" onClick={fetchData}>
                <i className={`fas fa-sync ${loading ? "fa-spin" : ""}`}></i>
              </Button>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        Loading history...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td className="text-capitalize fw-medium">{tx.type}</td>
                        <td className="text-muted">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <StatusBadge status={tx.status} />
                        </td>
                        <td
                          className={`text-end fw-bold ${
                            tx.status === "FAILED"
                              ? "text-muted text-decoration-line-through"
                              : tx.type === "withdraw"
                              ? "text-danger"
                              : "text-success"
                          }`}
                        >
                          {tx.type === "withdraw" ? "-" : "+"}${tx.amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

const AdminDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const CORE_URL = "http://localhost:5001";

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CORE_URL}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const stats = {
    total: transactions.length,
    success: transactions.filter((t) => t.status === "SUCCESS").length,
    failed: transactions.filter((t) => t.status === "FAILED").length,
  };

  return (
    <Container>
      <Row className="g-4">
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold">System Overview</h2>
              <p className="text-muted">Real-time transaction monitoring</p>
            </div>
            <Button onClick={fetchTransactions}>
              <i className={`fas fa-sync me-2 ${loading ? "fa-spin" : ""}`}></i>
              Refresh Log
            </Button>
          </div>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                <i className="fas fa-chart-bar text-primary fs-4"></i>
              </div>
              <div>
                <p className="text-muted mb-1">Total Transactions</p>
                <h4 className="fw-bold">{stats.total}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                <i className="fas fa-check-circle text-success fs-4"></i>
              </div>
              <div>
                <p className="text-muted mb-1">Successful</p>
                <h4 className="fw-bold">{stats.success}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Body className="d-flex align-items-center">
              <div className="bg-danger bg-opacity-10 rounded p-3 me-3">
                <i className="fas fa-exclamation-circle text-danger fs-4"></i>
              </div>
              <div>
                <p className="text-muted mb-1">Failed / Blocked</p>
                <h4 className="fw-bold">{stats.failed}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card>
            <div className="table-responsive">
              <Table hover>
                <thead className="table-dark">
                  <tr>
                    <th>Time</th>
                    <th>Card Number</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="text-muted font-monospace">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="font-monospace">{tx.cardNumber}</td>
                      <td className="text-capitalize">{tx.type}</td>
                      <td className="fw-medium">${tx.amount}</td>
                      <td>
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="text-muted fst-italic">
                        {tx.reason || "-"}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        No transactions recorded in System 2.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

const StatusBadge = ({ status }) => {
  const isSuccess = status === "SUCCESS";
  return (
    <Badge
      bg={isSuccess ? "success" : "danger"}
      className="d-flex align-items-center gap-1"
      style={{ width: "fit-content" }}
    >
      <i
        className={`fas fa-${
          isSuccess ? "check-circle" : "exclamation-circle"
        }`}
      ></i>
      {status}
    </Badge>
  );
};

export default App;
