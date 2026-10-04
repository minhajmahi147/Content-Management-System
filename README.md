# Content Management System

A REST API for managing content between **admins** and **content writers**, built with Django, Django REST Framework, JWT authentication and PostgreSQL.

Admins manage writers, assign content to them, leave feedback and approve finished work. Writers work on their assigned content and submit it for review.

## Content workflow

```
assigned  ->  in_progress  ->  pending_review  ->  approved
```

## Tech stack

- Django + Django REST Framework
- Simple JWT for authentication
- PostgreSQL
- Docker / Docker Compose (includes pgAdmin)

## Getting started

### Run with Docker (recommended)

```bash
docker compose up --build
```

In a second terminal, apply migrations and create a superuser:

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

| Service | URL |
| ------- | --- |
| API     | http://localhost:8000 |
| pgAdmin | http://localhost:5050 (`admin@admin.com` / `admin`) |

### Run locally

Requires a running PostgreSQL instance.

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export POSTGRES_HOST=localhost   # defaults: db / cms_db / mahi / mahi123 / 5432
python manage.py migrate
python manage.py runserver
```

Database settings are read from `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` (see `cms_project/config.py`).

## Authentication

Log in via `POST /login/` to receive JWT tokens, then send the access token on every request:

```
Authorization: Bearer <access_token>
```

Tokens can also be obtained and refreshed via `/api/token/` and `/api/token/refresh/`.

## API endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/users/` | Register a user (admin or writer) |
| POST | `/login/` | Log in |
| POST | `/logout/` | Log out |
| GET  | `/api/users/current/` | Current user |
| GET  | `/api/users/writers/` | All writers (admin only) |
| GET  | `/api/users/unassigned_writers/` | Writers without a manager |
| POST | `/api/users/assign_to_writer/` | Assign content to a writer (admin only) |
| GET  | `/api/contents/` | List contents |
| GET  | `/api/contents/{id}/` | Content detail |
| POST | `/api/contents/{id}/set_in_progress/` | Mark content as in progress |
| POST | `/api/contents/{id}/submit_for_review/` | Submit for review (writer only) |
| POST | `/api/contents/{id}/approve/` | Approve content (admin only) |
| POST | `/api/feedbacks/` | Leave feedback on content |

### Example requests

Register:

```json
{
  "username": "new_writer",
  "email": "writer@example.com",
  "password": "mahi1234",
  "password_confirm": "mahi1234",
  "role": "writer"
}
```

Login:

```json
{ "username": "new_writer", "password": "mahi1234" }
```

Assign content to a writer:

```json
{ "writer_id": 2, "title": "Test Article", "content": "This is a test article." }
```

Feedback:

```json
{ "content": 3, "comment": "Needs more detail" }
```
