"""
CRUD integration tests for /employees — backed by a real PostgreSQL container
spun up via Testcontainers (see conftest.py).
"""
import pytest


# ---------------------------------------------------------------------------
# GET /employees/
# ---------------------------------------------------------------------------

class TestGetEmployees:
    def test_returns_list(self, client, make_employee):
        make_employee(name="Alice Tester", email="alice@test.com")

        resp = client.get("/employees/")

        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_employee_shape(self, client, make_employee):
        pid = make_employee(name="Bob Tester", email="bob@test.com", phone="111222333")

        resp = client.get("/employees/")
        employees = resp.get_json()

        bob = next((e for e in employees if e["employee_id"] == pid), None)
        assert bob is not None
        assert bob["employee_name"] == "Bob Tester"
        assert bob["email"] == "bob@test.com"
        assert bob["phone"] == "111222333"
        assert bob["roles"] == "OPERATOR"
        assert "hire_date" in bob

    def test_employee_without_contacts_returns_null_fields(self, client, make_employee):
        pid = make_employee(name="NoContact Tester")

        resp = client.get("/employees/")
        employees = resp.get_json()

        emp = next((e for e in employees if e["employee_id"] == pid), None)
        assert emp is not None
        assert emp["email"] is None
        assert emp["phone"] is None


# ---------------------------------------------------------------------------
# DELETE /employees/<id>
# ---------------------------------------------------------------------------

class TestDeleteEmployee:
    def test_delete_existing_returns_204(self, client, make_employee):
        pid = make_employee(name="To Be Deleted")

        resp = client.delete(f"/employees/{pid}")

        assert resp.status_code == 204
        assert resp.data == b""

    def test_deleted_employee_not_found_afterwards(self, client, make_employee):
        pid = make_employee(name="Gone After Delete")

        client.delete(f"/employees/{pid}")

        resp = client.get(f"/employees/{pid}")
        assert resp.status_code == 404

    def test_delete_nonexistent_returns_404(self, client):
        resp = client.delete("/employees/999999")

        assert resp.status_code == 404
        assert "not found" in resp.get_json()["error"].lower()

    def test_delete_cascades_contacts(self, client, make_employee, db_engine):
        from sqlalchemy import text
        pid = make_employee(name="Cascade Test", email="cascade@test.com", phone="000111222")

        client.delete(f"/employees/{pid}")

        with db_engine.connect() as conn:
            count = conn.execute(
                text("SELECT COUNT(*) FROM party_contact WHERE party_id = :id"),
                {"id": pid}
            ).scalar()
        assert count == 0


# ---------------------------------------------------------------------------
# PATCH /employees/<id>
# ---------------------------------------------------------------------------

class TestPatchEmployee:
    def test_patch_name(self, client, make_employee):
        pid = make_employee(name="Original Name")

        resp = client.patch(f"/employees/{pid}", json={"name": "Updated Name"})

        assert resp.status_code == 200
        assert resp.get_json()["employee_name"] == "Updated Name"

    def test_patch_status(self, client, make_employee, db_engine):
        from sqlalchemy import text
        pid = make_employee(name="Status Patcher", status="ACTIVE")

        resp = client.patch(f"/employees/{pid}", json={"status": "INACTIVE"})

        assert resp.status_code == 200
        with db_engine.connect() as conn:
            status = conn.execute(
                text("SELECT data->>'status' FROM party WHERE party_id = :id"),
                {"id": pid}
            ).scalar()
        assert status == "INACTIVE"

    def test_patch_email_and_phone(self, client, make_employee):
        pid = make_employee(
            name="Contact Patcher",
            email="old@test.com",
            phone="000000000",
        )

        resp = client.patch(f"/employees/{pid}", json={
            "email": "new@test.com",
            "phone": "999999999",
        })

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["email"] == "new@test.com"
        assert data["phone"] == "999999999"

    def test_patch_adds_missing_contact(self, client, make_employee):
        pid = make_employee(name="No Phone Yet")

        resp = client.patch(f"/employees/{pid}", json={"phone": "123456789"})

        assert resp.status_code == 200
        assert resp.get_json()["phone"] == "123456789"

    def test_patch_multiple_fields_at_once(self, client, make_employee):
        pid = make_employee(name="Multi Patcher", email="multi@test.com")

        resp = client.patch(f"/employees/{pid}", json={
            "name": "Multi Done",
            "status": "INACTIVE",
            "email": "done@test.com",
        })

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["employee_name"] == "Multi Done"
        assert data["email"] == "done@test.com"

    def test_patch_nonexistent_returns_404(self, client):
        resp = client.patch("/employees/999999", json={"name": "Nobody"})

        assert resp.status_code == 404
        assert "not found" in resp.get_json()["error"].lower()

    def test_patch_empty_body_is_noop(self, client, make_employee):
        pid = make_employee(name="Unchanged")

        resp = client.patch(f"/employees/{pid}", json={})

        assert resp.status_code == 200
        assert resp.get_json()["employee_name"] == "Unchanged"
