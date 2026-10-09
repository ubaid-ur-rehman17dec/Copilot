import io


def test_upload_valid_image(make_client):
    client = make_client()
    image_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    files = {"file": ("test.png", io.BytesIO(image_content), "image/png")}

    response = client.post("/api/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/static/uploads/")
    assert data["url"].endswith(".png")
    assert data["mime_type"] == "image/png"


def test_upload_invalid_mime_type(make_client):
    client = make_client()
    files = {"file": ("test.txt", io.BytesIO(b"hello text"), "text/plain")}

    response = client.post("/api/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_oversized_file(make_client):
    client = make_client()
    # 11MB file exceeding 10MB limit
    large_content = b"0" * (11 * 1024 * 1024)
    files = {"file": ("large.jpeg", io.BytesIO(large_content), "image/jpeg")}

    response = client.post("/api/upload", files=files)
    assert response.status_code == 400
    assert "exceeds maximum limit" in response.json()["detail"]
