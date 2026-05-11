#!/bin/bash
# Run this once on a fresh EC2 instance (Ubuntu 22.04 / Amazon Linux 2023)
# Usage: ssh into EC2, then: curl -sSL <this-file> | bash

set -e

echo "=== Installing Docker ==="
sudo apt-get update -y || sudo yum update -y
sudo apt-get install -y docker.io docker-compose-plugin git || sudo yum install -y docker git
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker $USER

echo "=== Cloning repo ==="
cd ~
git clone https://github.com/Aryan2vb/ornava.git || (cd ornava && git pull)
cd ornava

echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "1. Create .env.production in ~/ornava/ with your secrets"
echo "2. Run: docker compose -f docker-compose.production.yml up -d --build"
echo "3. Seed invite code: docker exec ornava-web node -e \"...\""
echo ""
echo "Add these GitHub Secrets for CI/CD:"
echo "  EC2_HOST     = <your-ec2-public-ip>"
echo "  EC2_USER     = ubuntu (or ec2-user)"
echo "  EC2_SSH_KEY  = <your-private-key-content>"
