FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy prisma schema first
COPY prisma/ ./prisma/

# Generate Prisma client with verbose output
RUN prisma generate --schema=./prisma/schema.prisma

# Copy rest of the source code
COPY . .

# Fetch Prisma binaries
RUN prisma py fetch

# Set default port (can be overridden by environment)
ENV PORT=8000
EXPOSE $PORT

CMD ["python", "app.py"]
