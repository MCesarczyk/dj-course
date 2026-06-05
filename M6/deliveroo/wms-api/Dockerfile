FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml .
RUN --mount=type=cache,id=pip-wms-api,target=/root/.cache/pip \
    pip install . \
    && groupadd --system appgroup \
    && useradd --system --gid appgroup appuser \
    && chown -R appuser:appgroup /app
COPY --chown=appuser:appgroup . .
EXPOSE 3001
USER appuser
CMD ["python", "src/run.py"]
