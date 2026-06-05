FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,id=pip-tms-api,target=/root/.cache/pip \
    pip install -r requirements.txt \
    && groupadd --system appgroup \
    && useradd --system --gid appgroup appuser \
    && chown -R appuser:appgroup /app
COPY --chown=appuser:appgroup . .
EXPOSE 3030
USER appuser
CMD ["python", "app.py"]
