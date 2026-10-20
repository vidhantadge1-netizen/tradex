# TradeX — Smart Stock Trading and Portfolio Management

> **College Project Edition**  
> A full-stack MERN paper-trading platform enabling students, beginners, and investors to practice buying and selling stocks with **₹100,000 in virtual capital** without risking real money.

---

## 📌 Table of Contents
1. [Overview & Objective](#overview--objective)
2. [Technology Stack](#technology-stack)
3. [Key Features & Capabilities](#key-features--capabilities)
4. [Financial Engine & Mathematical Formulas](#financial-engine--mathematical-formulas)
5. [Architecture & Project Structure](#architecture--project-structure)
6. [Quickstart & Setup Instructions](#quickstart--setup-instructions)
7. [Demo Account & Database Seeding](#demo-account--database-seeding)
8. [Automated Testing Suite](#automated-testing-suite)
9. [REST API Documentation](#rest-api-documentation)
10. [Evaluation & Defense Guide](#evaluation--defense-guide)

---

## 🎯 Overview & Objective

**TradeX** is built to bridge the gap between financial theory and practical execution. Beginners often hesitate to learn stock trading due to fear of capital loss. TradeX eliminates this barrier by providing:
- A realistic simulation of modern stock exchanges (NSE & NASDAQ).
- An initial **₹100,000.00** in virtual paper funds for every newly registered trader.
- Interactive charting and technical metrics (Day High/Low, 52-Week Range, P/E Ratio, Market Cap).
- Real-time portfolio tracking, cost basis accounting, asset allocation donut charts, and an exportable transaction audit trail.
- Absolute transparency: all quotes and trades are clearly labeled with simulated notices.

---

## 💻 Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6 |
| **Styling & UI** | Tailwind CSS (Dark Navy Fintech Theme), Lucide React Icons |
| **Data Visualizations** | Recharts (Area charts, Donut charts, custom tooltips) |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM (includes seamless embedded `mongodb-memory-server` fallback) |
| **Security & Auth** | JSON Web Tokens (JWT), bcryptjs password hashing, Helmet, CORS, Rate Limiting |
| **Testing** | Jest, Supertest |
| **HTTP Client** | Axios (with token injection and auto-interception) |

---

## ✨ Key Features & Capabilities

### 1. Landing Page & Financial Sandbox
- Educational presentation detailing virtual trading mechanics.
- Live simulated market ticker for Indian blue-chips and global tech giants.
- 1-Click Demo Account Login button for instant examiner review.

### 2. User Authentication & Wallet Initialization
- User registration with validation and password hashing (bcrypt).
- Automatic balance initialization to **₹100,000.00** in virtual currency.
- JWT-protected private routes and persistent session management.

### 3. Real-Time Trading Engine
- Modal-based order execution with **BUY** and **SELL** tabs.
- Multiplier chips (25%, 50%, 75%, 100%) calculated dynamically against available cash (for buy) or owned shares (for sell).
- **Strict Server-Side Validation**:
  - Rejects buy orders if virtual cash is insufficient.
  - Rejects sell orders if the user does not own the stock or attempts to oversell.
  - Prevents race conditions and negative balances.
  - Never trusts client-submitted prices; uses authoritative server quotes.

### 4. Portfolio Analytics & Asset Allocation
- Summary cards: Total Portfolio Value, Cash Balance, Total Invested, Unrealized P&L, Realized P&L, Net P&L.
- Interactive Recharts Donut Chart breaking down asset allocation between liquid cash and equity positions.
- Holdings table with real-time profit/loss indicators and quick liquidation/accumulation buttons.
- Collapsible financial calculation reference card.

### 5. Watchlist Management
- 1-click star/bookmark functionality across market listings and stock detail views.
- Dedicated watchlist dashboard displaying live prices, 24-hour percentage shifts, and direct trade shortcuts.

### 6. Transaction History & CSV Export
- Immutable audit log of every executed buy and sell transaction.
- Filter by order type (`ALL`, `BUY`, `SELL`) and symbol search.
- **Export to CSV**: Generates a formatted spreadsheet report for academic submission or offline analysis.

---

## 📐 Financial Engine & Mathematical Formulas

TradeX implements standard institutional accounting principles:

### 1. Weighted Average Cost (WAC)
When purchasing additional shares of an already held stock:
$$\text{Average Buy Price} = \frac{\text{Previous Total Cost} + (\text{New Shares} \times \text{Execution Price})}{\text{Previous Quantity} + \text{New Shares}}$$

### 2. Unrealized Profit / Loss (Floating P&L)
$$\text{Unrealized P\&L} = (\text{Current Market Price} - \text{Average Buy Price}) \times \text{Current Quantity Held}$$
$$\text{Unrealized P\&L \%} = \left(\frac{\text{Unrealized P\&L}}{\text{Total Invested}}\right) \times 100$$

### 3. Realized Profit / Loss (Booked P&L on Sell)
When closing or partially liquidating a position:
$$\text{Cost Basis Sold} = \text{Average Buy Price} \times \text{Quantity Sold}$$
$$\text{Realized P\&L} = (\text{Execution Price} \times \text{Quantity Sold}) - \text{Cost Basis Sold}$$

### 4. Total Portfolio Valuation
$$\text{Total Portfolio Value} = \text{Virtual Cash Balance} + \sum_{i=1}^{n} (\text{Quantity}_i \times \text{Current Price}_i)$$

---

## 🗂️ Architecture & Project Structure

```
tradex/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # Dual-mode DB: Local Mongo or MemoryServer fallback
│   │   │   └── env.js            # Environment validation & defaults
│   │   ├── controllers/
│   │   │   ├── authController.js       # Register, login, profile
│   │   │   ├── stockController.js      # Quotes, history, overview, sectors
│   │   │   ├── tradeController.js      # Buy, sell, transaction audit
│   │   │   ├── portfolioController.js  # Holdings, asset allocation, P&L
│   │   │   └── watchlistController.js  # Watchlist CRUD
│   │   ├── data/
│   │   │   └── sampleStocks.js   # 15 realistic equities with 30-day historical points
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT Bearer verification
│   │   │   ├── errorHandler.js   # Centralized JSON error format
│   │   │   └── validate.js       # Input payload sanitizers
│   │   ├── models/
│   │   │   ├── User.js           # Credentials & virtual cash balance
│   │   │   ├── Stock.js          # Symbol, price, metrics, history
│   │   │   ├── Holding.js        # User position & average cost
│   │   │   ├── Trade.js          # Audit log with realized P&L
│   │   │   └── Watchlist.js      # User pinned symbols
│   │   ├── routes/               # Express endpoint definitions
│   │   ├── scripts/
│   │   │   └── seed.js           # Database population & demo account setup
│   │   ├── services/
│   │   │   ├── marketDataService.js # Simulated ticks & interval charts
│   │   │   └── tradeService.js      # Atomic buy/sell execution logic
│   │   ├── tests/
│   │   │   ├── auth.test.js      # Auth & initial ₹100k balance tests
│   │   │   ├── trade.test.js     # Buy, sell, funds & oversell tests
│   │   │   └── portfolio.test.js # Portfolio & watchlist tests
│   │   ├── app.js                # Express app assembly & middleware
│   │   └── server.js             # Server lifecycle bootstrap
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # StatCard, StockChart, OrderModal, Badge, Toast
│   │   │   └── layout/           # Navbar, Sidebar, Footer, Layout shell
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication & virtual balance state
│   │   │   └── ToastContext.jsx  # Floating notifications
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Presentation & overview
│   │   │   ├── Dashboard.jsx     # Main trading hub
│   │   │   ├── StockMarket.jsx   # Search & filterable directory
│   │   │   ├── StockDetail.jsx   # Deep-dive chart & metrics
│   │   │   ├── Portfolio.jsx     # Positions & asset donut chart
│   │   │   ├── Watchlist.jsx     # Pinned equities
│   │   │   ├── TradeHistory.jsx  # Audit log with CSV download
│   │   │   ├── Login.jsx         # Authentication & 1-click demo
│   │   │   └── Register.jsx      # New account with ₹100k credit
│   │   ├── services/
│   │   │   └── api.js            # Axios client with interceptors
│   │   ├── utils/
│   │   │   └── formatters.js     # Currency (₹), percent, & date formats
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── package.json                  # Root runner scripts
└── README.md
```

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- Node.js (v18.x or newer)
- npm (v9.x or newer)
- *Optional*: Local MongoDB (If MongoDB is not installed, TradeX automatically boots its embedded in-memory database with zero configuration required!)

### Step 1: Install Dependencies
From the root directory:
```bash
npm run install:all
```

*(Or individually)*:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Seed the Database
Populate realistic equities and initialize the demo user:
```bash
npm run seed
```

### Step 3: Run the Application
Open two terminal windows:

**Terminal 1 (Backend API on Port 5000):**
```bash
cd backend
npm run dev
# Or: npm start
```

**Terminal 2 (Frontend on Port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 👤 Demo Account & Database Seeding

The application includes a pre-configured demo account populated with active positions and transactions:

- **Email**: `demo@tradex.com`
- **Password**: `Demo@12345`
- **Starting Cash**: ₹100,000.00
- **Pre-seeded Holdings**:
  - Reliance Industries (`RELIANCE`)
  - Tata Consultancy Services (`TCS`)
  - HDFC Bank (`HDFCBANK`)
- **Pre-seeded Watchlist**: `INFY`, `TATAMOTORS`, `AAPL`, `NVDA`

You can log in either by typing the credentials or clicking the **"1-Click Demo Login"** button on the Login and Landing pages.

---

## 🧪 Automated Testing Suite

TradeX features 22 comprehensive integration tests covering critical financial logic:

```bash
cd backend
npm test
```

### What the test suite verifies:
1. **User Registration & Balance**: Verifies new accounts receive exactly ₹100,000.00 virtual cash and passwords are salt-hashed.
2. **Duplicate Email Rejection**: Rejects duplicate signups with HTTP 400.
3. **JWT Authentication**: Validates tokens, expiry handling, and protected route rejection.
4. **Order Execution (Buy)**: Deducts cash, establishes/averages holdings, and logs audit record.
5. **Insufficient Funds Guard**: Rejects buy orders when total cost exceeds available balance.
6. **Order Execution (Sell)**: Credits cash, decreases/removes holding, and calculates realized P&L.
7. **Overselling Guard**: Rejects sell orders attempting to sell more shares than held.
8. **Unowned Stock Guard**: Rejects sell orders for stocks the user does not own.
9. **Portfolio Aggregation**: Verifies cost basis, market value, unrealized P&L, and asset allocation.
10. **Watchlist CRUD**: Verifies add, list with populated quotes, and deletion.

---

## 🔌 REST API Documentation

Base URL: `http://localhost:5000/api`

### 1. Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register user with ₹100k balance |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT |
| `GET` | `/auth/me` | Private | Retrieve active user profile |

### 2. Stocks & Market Data (`/stocks`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/stocks` | Public | List stocks with search, sector, & sort |
| `GET` | `/stocks/overview/market` | Public | Indices, top gainers, losers, & volume |
| `GET` | `/stocks/sectors/list` | Public | List distinct industry sectors |
| `GET` | `/stocks/:symbol` | Public | Retrieve detailed stock metrics |
| `GET` | `/stocks/:symbol/history` | Public | Historical price series (1D, 1W, 1M, 1Y, ALL) |

### 3. Virtual Trading Engine (`/trades`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/trades/buy` | Private | Execute Buy order (checks virtual balance) |
| `POST` | `/trades/sell` | Private | Execute Sell order (guards overselling, computes P&L) |
| `GET` | `/trades/history` | Private | Retrieve user trade audit trail with filters |

### 4. Portfolio Management (`/portfolio`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/portfolio` | Private | Comprehensive portfolio metrics, holdings, & allocation |

### 5. Watchlist (`/watchlist`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/watchlist` | Private | Get user watchlist with populated stock quotes |
| `POST` | `/watchlist` | Private | Add symbol to user watchlist |
| `DELETE`| `/watchlist/:symbol` | Private | Remove symbol from watchlist |

### 6. System Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service health & version status |

---

## 🎓 Evaluation & Defense Guide

### Key Questions & Answers for Viva / Presentation:

**Q: How does the system ensure data consistency during order execution?**  
*A: Order execution logic in `tradeService.js` performs server-side atomic validations. It verifies user balance and holding quantities against authoritative database records rather than trusting client-sent figures. The holding updates use weighted average cost recalculation, and cash deductions/credits occur in tandem with trade audit log creation.*

**Q: How is the demo evaluated if MongoDB is not installed on the professor's computer?**  
*A: `db.js` implements a hybrid failover strategy. It attempts connection to `MONGODB_URI` first. If no local or remote daemon is reachable, it automatically initializes an embedded `mongodb-memory-server` instance. The application boots and functions out-of-the-box with zero setup.*

**Q: How does the application differentiate between live and simulated market data?**  
*A: In accordance with financial guidelines, all sample prices are accompanied by `SIMULATED` badges on navigation bars, stock detail views, and market tables. The architecture abstracts market data through `marketDataService.js`, which can be connected to Finnhub or AlphaVantage by supplying an API key in `.env`.*

---

## 📄 License
This project is licensed under the MIT License — created for academic and educational evaluation.
