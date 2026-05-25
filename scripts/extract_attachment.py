import base64
import json
import os
import sys
import tempfile
from pathlib import Path


def extract_docx_text(file_path: str) -> str:
    import docx

    document = docx.Document(file_path)
    parts = []
    for paragraph in document.paragraphs:
      text = (paragraph.text or "").strip()
      if text:
        parts.append(text)
    return "\n\n".join(parts).strip()


def extract_pdf_text(file_path: str) -> str:
    from pypdf import PdfReader

    reader = PdfReader(file_path)
    parts = []
    for page in reader.pages:
      text = (page.extract_text() or "").strip()
      if text:
        parts.append(text)
    return "\n\n".join(parts).strip()


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    filename = payload.get("fileName") or "document.bin"
    content_base64 = payload.get("contentBase64") or ""
    extension = Path(filename).suffix.lower().lstrip(".")

    if not content_base64:
        raise ValueError("contentBase64 obrigatorio")

    decoded = base64.b64decode(content_base64)

    fd, temp_path = tempfile.mkstemp(suffix=f".{extension}" if extension else "")
    os.close(fd)
    try:
        with open(temp_path, "wb") as handle:
            handle.write(decoded)

        if extension == "docx":
            text = extract_docx_text(temp_path)
        elif extension == "pdf":
            text = extract_pdf_text(temp_path)
        else:
            raise ValueError(f"Extensao nao suportada para extracao: {extension}")

        sys.stdout.write(json.dumps({"text": text}, ensure_ascii=False))
    finally:
        try:
            os.remove(temp_path)
        except FileNotFoundError:
            pass


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        sys.stderr.write(str(exc))
        sys.exit(1)
