# Supplier-Consumer Platform (B2B Food Supply)

MVP backend for a B2B food supply platform connecting suppliers with restaurants/consumers.

## 📋 Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Database
- **Alembic** - Database migrations
- **JWT** - Authentication (PyJWT)
- **Passlib** - Password hashing (Bcrypt)

## 🚀 Quick Start for Developers

Follow these steps to get the backend running on your local machine.

### Prerequisites

- **Python 3.11** (required)
- **PostgreSQL 12+** (database server)

---

### Step 1: Install Python 3.11

**macOS:**
```bash
brew install python@3.11
```

**Windows:**
- Download from [python.org](https://www.python.org/downloads/)
- During installation, ✅ CHECK "Add Python to PATH"

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv
```

**Verify installation:**
```bash
python3.11 --version
# Should show: Python 3.11.x
```

---

### Step 2: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install with default settings
- Remember the password you set for user `postgres`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Verify PostgreSQL is running:**
```bash
psql postgres
# If successful, type \q to exit
```

---

### Step 3: Clone Repository and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd SWE_Lab

# Create virtual environment with Python 3.11
python3.11 -m venv .venv

# Activate virtual environment
# macOS/Linux:
source .venv/bin/activate

# Windows:
.venv\Scripts\activate

# You should see (.venv) in your terminal prompt

# Install dependencies
pip install -r requirements.txt
```

---

### Step 4: Create Local Database

**Important:** Your database is **completely local** - changes only affect your computer.

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE supplier_consumer_db;

# Exit
\q
```

**Alternative (command line):**
```bash
createdb -U postgres supplier_consumer_db
```

---

### Step 5: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# macOS/Linux:
touch .env

# Windows:
type nul > .env
```

Add the following content (replace `YOUR_PASSWORD` with your PostgreSQL password):

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/supplier_consumer_db

# JWT Configuration
JWT_SECRET_KEY=local-dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Application Settings
APP_NAME="Supplier Consumer Platform"
DEBUG=True
```

**Example:**
```env
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/supplier_consumer_db
```

---

### Step 6: Run Database Migrations

This creates all necessary tables in your database:

```bash
# Create initial migration (first time only)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations to create tables
alembic upgrade head
```

**What this creates:** Tables for users, suppliers, products, orders, messages, complaints, etc.

---

### Step 7: Start the Backend Server

```bash
uvicorn app.main:app --reload
```

**Success! You should see:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

**Keep this terminal window open while developing.**

---

### Step 8: Test the API

Open your browser and visit:

**🔗 http://localhost:8000/docs**

You'll see interactive API documentation (Swagger UI).

#### Try it out:

1. **Health Check:**
   - Click `GET /health`
   - Click "Try it out" → "Execute"
   - Should return: `{"status": "healthy"}`

2. **Register a Supplier:**
   - Go to `POST /api/auth/register/supplier`
   - Click "Try it out"
   - Fill in the request body:
     ```json
     {
       "company_name": "Test Supplier Co",
       "owner_full_name": "John Doe",
       "owner_email": "john@example.com",
       "password": "password123"
     }
     ```
   - Click "Execute"
   - Copy the `access_token` from the response

3. **Authorize:**
   - Click the **🔒 Authorize** button at the top of the page
   - Paste your token in the "Value" field
   - Click "Authorize" then "Close"

4. **Test Protected Endpoint:**
   - Try `GET /api/auth/me`
   - Should return your user information

---

## 🎯 Common Questions

### Q: Is my database shared with other developers?
**A: NO!** Your PostgreSQL database is 100% local on your computer. Each developer has their own separate database.

### Q: What if I mess up the database?
**A: Easy to reset:**
```bash
# Drop and recreate
psql -U postgres
DROP DATABASE supplier_consumer_db;
CREATE DATABASE supplier_consumer_db;
\q

# Re-run migrations
alembic upgrade head
```

### Q: Do I need to keep the terminal open?
**A: Yes!** The server runs in the terminal. Close it and the server stops.

### Q: How do I stop the server?
**A:** Press `CTRL+C` in the terminal

### Q: How do I run it again later?
```bash
cd SWE_Lab
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload
```

---

## 🔧 Troubleshooting

### "ModuleNotFoundError"
Virtual environment not activated or dependencies not installed:
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### "could not connect to server"
PostgreSQL is not running. Start it:
- **macOS:** `brew services start postgresql@15`
- **Windows:** Open Services app, start "PostgreSQL"
- **Linux:** `sudo systemctl start postgresql`

### "password authentication failed"
Wrong password in `.env` file. Update `DATABASE_URL` with correct PostgreSQL password.

### "relation does not exist"
Migrations not applied:
```bash
alembic upgrade head
```

### "command not found: python3.11"
Python 3.11 not installed or not in PATH. Check installation step.

---

## 📁 Project Structure

```
SWE_Lab/
├── app/                    # Main application code
│   ├── main.py            # FastAPI entry point
│   ├── api/routes/        # API endpoints
│   │   ├── auth.py        # Authentication (register, login)
│   │   ├── suppliers.py   # Suppliers and links management
│   │   ├── products.py    # Product catalog
│   │   ├── orders.py      # Order management
│   │   ├── messages.py    # Chat system
│   │   └── complaints.py  # Complaint handling
│   ├── core/              # Configuration and security
│   │   ├── config.py      # Settings from .env
│   │   ├── security.py    # JWT and password hashing
│   │   └── dependencies.py # Auth dependencies
│   ├── models/            # Database models (SQLAlchemy)
│   │   └── models.py
│   ├── schemas/           # Request/response models (Pydantic)
│   │   └── schemas.py
│   └── db/                # Database connection
│       └── session.py
├── alembic/               # Database migrations
├── requirements.txt       # Python dependencies
├── .env                   # Your local configuration (not in git)
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

---

## 🎓 Features

- **Authentication**: JWT-based auth with role-based access control
- **Roles**: 
  - `OWNER` - Full supplier management access
  - `MANAGER` - Supplier operations management
  - `SALES` - Customer-facing operations
  - `CONSUMER` - Restaurant/buyer accounts
- **Supplier Management**: Registration, listing, linking with consumers
- **Product Catalog**: CRUD operations for supplier products
- **Orders**: Complete order lifecycle management
- **Messages**: Real-time chat between suppliers and consumers
- **Complaints**: Complaint tracking and resolution system

---

## 📚 API Endpoints Overview

All endpoints are documented at: **http://localhost:8000/docs**

### Authentication (`/api/auth`)
- `POST /register/supplier` - Register new supplier with owner
- `POST /register/consumer` - Register new consumer/restaurant
- `POST /login` - Login and receive JWT token
- `GET /me` - Get current user information

### Suppliers & Links (`/api`)
- `GET /suppliers` - List all suppliers (Consumer)
- `POST /links` - Request link to supplier (Consumer)
- `GET /links/me` - Get my links
- `GET /links/pending` - Get pending requests (Owner/Manager)
- `POST /links/{id}/approve` - Approve link request
- `POST /links/{id}/reject` - Reject link request

### Products (`/api/supplier/products`)
- `GET /` - List supplier's products
- `POST /` - Create new product (Owner/Manager)
- `PUT /{id}` - Update product (Owner/Manager)
- `DELETE /{id}` - Delete product (Owner/Manager)

### Orders (`/api/orders`)
- `POST /` - Create order (Consumer)
- `GET /` - List orders with filters
- `GET /{id}` - Get order details
- `PUT /{id}` - Update order status (Owner/Manager)

### Messages (`/api/messages`)
- `GET /{link_id}` - Get messages for a link
- `POST /{link_id}` - Send message

### Complaints (`/api`)
- `POST /orders/{id}/complaint` - Create complaint (Consumer)
- `GET /complaints` - List complaints
- `PUT /complaints/{id}` - Update complaint status (Staff)

---

## 🔐 Security Notes

- **Never commit `.env` file** - It's in `.gitignore`
- Change `JWT_SECRET_KEY` in production to a strong random string
- Use strong passwords for production databases
- Set `DEBUG=False` in production

---

## 🚀 Next Steps

1. Explore the API documentation at http://localhost:8000/docs
2. Register test accounts (supplier and consumer)
3. Test the complete workflow: register → link → products → orders
4. Check your database: `psql -U postgres supplier_consumer_db`
5. Explore the codebase in the `app/` directory

---

## 🆘 Need Help?

If you encounter issues:

1. Check that PostgreSQL is running
2. Verify virtual environment is activated (see `(.venv)` in terminal)
3. Confirm `.env` file has correct database password
4. Ensure migrations ran: `alembic current`

For bugs or questions, open an issue with:
- Your operating system
- Full error message
- Steps to reproduce

---

**Happy Coding! 🎉**
