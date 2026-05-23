FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && groupadd --system appgroup \
    && useradd --system --gid appgroup appuser \
    && chown -R appuser:appgroup /app
COPY --chown=appuser:appgroup . .
EXPOSE 3030
USER appuser
CMD ["python", "app.py"]
