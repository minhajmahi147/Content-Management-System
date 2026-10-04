import os
from pathlib import Path


# Use PostgreSQL when POSTGRES_HOST is set (e.g. docker-compose), otherwise a local SQLite file.
if os.environ.get('POSTGRES_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'cms_db'),
            'USER': os.environ.get('POSTGRES_USER', 'mahi'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'mahi123'),
            'HOST': os.environ['POSTGRES_HOST'],
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': Path(__file__).resolve().parent.parent / 'db.sqlite3',
        }
    }
