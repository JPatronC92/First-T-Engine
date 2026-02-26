# Lex MX Engine - Gemini Context

This file provides architectural and contextual information about the `lex-mx-engine` project to assist Gemini in understanding the codebase and providing relevant suggestions.

## Project Overview

`lex-mx-engine` is a backend service designed for processing, versioning, and analyzing legal or regulatory compliance rules (specifically Mexican laws, given the "MX" and the `cff_2026_sample.json` data seed). 

It exposes a RESTful API built with **FastAPI** and uses **PostgreSQL** as its relational database. The project interacts with Large Language Models (LLMs) via **LiteLLM**, making it agnostic to the specific underlying model (e.g., GPT-4o, DeepSeek). 

### Key Technologies
*   **Language:** Python 3.12+
*   **Web Framework:** FastAPI
*   **Database:** PostgreSQL (with `asyncpg` async driver)
*   **ORM:** SQLAlchemy 2.0 (Async)
*   **Migrations:** Alembic
*   **LLM Integration:** LiteLLM
*   **Configuration:** Pydantic Settings
*   **Package Manager:** `uv` (indicated by `uv.lock`)
*   **Testing:** `pytest` (with `pytest-asyncio`)
*   **Other Tools:** `json-logic-qubit`, `playwright` (potentially for scraping/rendering)

## Architecture

The project follows a **Domain-Driven Design (DDD)** / **Clean Architecture** style structure. The codebase is organized inside the `src/` directory to separate concerns:

*   `src/core/`: Application-wide configuration (`config.py`) using Pydantic Settings.
*   `src/domain/`: Core business logic, domain models (e.g., `Norma`, `UnidadEstructural`, `VersionContenido`), Pydantic schemas, and core services like `compliance_engine.py` and `resolver.py`.
*   `src/infrastructure/`: Concrete implementations for interacting with external systems: Database connections, repositories, and the LLM client.
*   `src/interfaces/api/`: The FastAPI application layer (`main.py`) and API routers (`v1/compliance.py`, `v1/history.py`).
*   `src/pipeline/`: Components for processing data pipelines, including patchers, OCR processors, diff engines, and scrapers (e.g., `dof_spider.py` for the Diario Oficial de la Federación).

## Development Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
```bash
cp .env.example .env
```
Key variables include database credentials and `LLM_API_KEY`.

### 2. Database Services
The project uses Docker Compose to manage the PostgreSQL database.
Start the database and install necessary extensions:
```bash
./setup_db.sh
```
*Note: The database requires the `btree_gist` extension to manage temporal/versioning ranges (`vigencia`).*

### 3. Dependencies
The project uses `uv` for dependency management. To install:
```bash
uv sync # or uv pip install -r pyproject.toml
```

### 4. Running the Application
The FastAPI server can be started using Uvicorn (usually available in the virtual environment):
```bash
uvicorn src.interfaces.api.main:app --reload
```

### 5. Database Migrations & Seeding
*   **Migrations:** Use Alembic to apply structural changes: `alembic upgrade head`
*   **Seeding Data:** Run the seeding script to populate initial data (e.g., CFF 2026): `python scripts/seed_cff_2026.py`

### 6. Testing
Tests are located in the `tests/` directory and can be executed with `pytest`:
```bash
pytest
```

## Conventions

*   **Async First:** The application relies heavily on asynchronous programming (`async/await`) for database operations (`asyncpg`, `AsyncSessionLocal`) and API endpoints.
*   **Type Hinting:** Strict type hinting is enforced, often validated via Pydantic models.
*   **Formatting/Linting:** The project utilizes `ruff`, `black`, and `isort` as development dependencies to enforce code style.