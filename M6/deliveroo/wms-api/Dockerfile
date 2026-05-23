FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir . \
    && groupadd --system appgroup \
    && useradd --system --gid appgroup appuser \
    && chown -R appuser:appgroup /app
COPY --chown=appuser:appgroup . .
EXPOSE 3001
USER appuser
CMD ["python", "src/run.py"]
