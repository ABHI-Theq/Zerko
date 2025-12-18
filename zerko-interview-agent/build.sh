#!/bin/bash
pip install -r requirements.txt
prisma generate
prisma py fetch