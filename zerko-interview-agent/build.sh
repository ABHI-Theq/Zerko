#!/bin/bash
set -e
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Generating Prisma client..."
prisma generate

echo "Fetching Prisma binaries..."
prisma py fetch

echo "Build completed successfully!"