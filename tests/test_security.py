import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException

import src.core.security as security


@pytest.mark.asyncio
async def test_get_current_tenant_valid_token():
    # Setup
    tenant_id = uuid.uuid4()
    token = security.create_access_token({"sub": str(tenant_id)})

    # Mock DB session
    class MockResult:
        def scalar_one_or_none(self):
            class MockTenant:
                id = tenant_id

            return MockTenant()

    class MockDB:
        async def execute(self, query):
            return MockResult()

    # Execute
    tenant = await security.get_current_tenant(token=token, api_key=None, db=MockDB())

    # Assert
    assert tenant.id == tenant_id


@pytest.mark.asyncio
async def test_get_current_tenant_invalid_audience():
    # Setup token with wrong audience
    tenant_id = uuid.uuid4()
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": str(tenant_id), "exp": expire, "aud": "wrong-audience"}
    token = jwt.encode(to_encode, security.settings.SECRET_KEY, algorithm=security.ALGORITHM)

    # Mock DB session
    class MockDB:
        async def execute(self, query):
            pass  # Shouldn't reach here

    # Execute and Assert
    with pytest.raises(HTTPException) as exc_info:
        await security.get_current_tenant(token=token, api_key=None, db=MockDB())

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Could not validate credentials"


def test_get_password_hash():
    password = "secretpassword"
    hashed_password = security.get_password_hash(password)
    assert hashed_password != password
    assert len(hashed_password) > 0


def test_verify_password():
    password = "secretpassword"
    hashed_password = security.get_password_hash(password)
    assert security.verify_password(password, hashed_password) is True
    assert security.verify_password("wrongpassword", hashed_password) is False


def test_password_hashing_is_nondeterministic():
    password = "secretpassword"
    hash1 = security.get_password_hash(password)
    hash2 = security.get_password_hash(password)
    assert hash1 != hash2
