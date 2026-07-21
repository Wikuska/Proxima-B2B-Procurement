FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt requirements-ai.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r requirements-ai.txt

# Bake the embedding model into the image (same name as EMBEDDING_MODEL_NAME in settings).
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

COPY . .

CMD alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000
