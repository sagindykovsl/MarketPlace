# Supplier-Consumer Platform (B2B Food Supply)

MVP backend for a B2B food supply platform connecting suppliers with restaurants/consumers.

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure database (edit .env file with your PostgreSQL credentials)

# 3. Run migrations
alembic upgrade head

# 4. (Optional) Add sample data
python scripts/init_db.py

# 5. Start the server
uvicorn app.main:app --reload
```

Visit http://localhost:8000/docs for interactive API documentation!

## 📋 Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Database
- **Alembic** - Database migrations
- **JWT** - Authentication (PyJWT)
- **Passlib** - Password hashing (Bcrypt)

## 🧪 Verify Setup

Run the setup verification script:

```bash
python test_setup.py
```

This will verify all dependencies are installed and configured correctly.

## 📖 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Complete API usage examples
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Database schema and ERD
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview

## ⚙️ Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
# Edit .env with your database credentials and JWT secret
# A default .env file has been created
```

4. Create PostgreSQL database:
```bash
createdb supplier_consumer_db
```

5. Run migrations:
```bash
alembic upgrade head
```

6. (Optional) Initialize with sample data:
```bash
python scripts/init_db.py
```

7. Start the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## Project Structure

```
app/
├── main.py              # FastAPI application entry point
├── core/                # Core functionality (config, security)
│   ├── config.py
│   ├── security.py
│   └── dependencies.py
├── models/              # SQLAlchemy models
│   └── models.py
├── schemas/             # Pydantic schemas
│   └── schemas.py
├── api/                 # API routes
│   └── routes/
│       ├── auth.py
│       ├── suppliers.py
│       ├── products.py
│       ├── orders.py
│       ├── messages.py
│       └── complaints.py
├── db/                  # Database setup
│   └── session.py
└── tests/               # Tests (future)
```

## Features

- **Authentication**: JWT-based auth with role-based access control
- **Roles**: OWNER, MANAGER, SALES (supplier staff), CONSUMER
- **Supplier Management**: Registration, listing, linking with consumers
- **Product Catalog**: CRUD operations for suppliers
- **Orders**: Place and manage orders between consumers and suppliers
- **Chat**: Message system for supplier-consumer communication
- **Complaints**: Complaint management system for orders

## API Endpoints

See `/docs` for interactive API documentation.

