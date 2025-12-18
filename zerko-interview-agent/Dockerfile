FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate Prisma client and fetch binaries
RUN prisma generate
RUN prisma py fetch

EXPOSE 8000

CMD ["python","app.py"]
