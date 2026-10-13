import pytest
from starlette.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.config import settings

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def admin_token():
    return create_access_token({
        "sub": "usr_admin_demo",
        "email": "admin@pyqverse.edu",
        "role": "admin",
        "name": "Prof. Rajesh (Admin)"
    })

@pytest.fixture
def student_token():
    return create_access_token({
        "sub": "usr_student_demo",
        "email": "student@pyqverse.edu",
        "role": "student",
        "name": "Aarav Sharma"
    })

@pytest.fixture
def editor_token():
    return create_access_token({
        "sub": "usr_editor_demo",
        "email": "editor@pyqverse.edu",
        "role": "editor",
        "name": "Priya Mukherjee"
    })
