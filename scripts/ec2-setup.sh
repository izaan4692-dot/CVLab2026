#!/bin/bash

# CVLab EC2 Setup Script
# Run this script on your EC2 instance to set up Docker and prerequisites

set -e

echo "================================"
echo "CVLab EC2 Setup Script"
echo "================================"

# Update system
echo "Updating system packages..."
sudo yum update -y || sudo apt-get update -y

# Install Docker
echo "Installing Docker..."
if command -v amazon-linux-extras &> /dev/null; then
    # Amazon Linux 2
    sudo amazon-linux-extras install docker -y
elif [ -f /etc/os-release ] && grep -q "Ubuntu" /etc/os-release; then
    # Ubuntu
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
else
    # Amazon Linux 2023 or other
    sudo yum install -y docker
fi

# Start Docker service
echo "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
echo "Adding user to docker group..."
sudo usermod -aG docker $USER

# Install Docker Compose
echo "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="v2.24.0"
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
echo "Creating application directory..."
mkdir -p ~/cvlab
cd ~/cvlab

# Create .env.production template
if [ ! -f .env.production ]; then
    echo "Creating .env.production template..."
    cat > .env.production << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
NEXT_PUBLIC_API_URL=your_backend_api_url

# Add other environment variables as needed
EOF
    echo "Please edit ~/cvlab/.env.production with your actual values"
fi

# Install Nginx for reverse proxy (optional but recommended)
echo "Installing Nginx..."
sudo yum install -y nginx || sudo apt-get install -y nginx
sudo systemctl enable nginx

# Create Nginx config
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/conf.d/cvlab.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Remove default nginx config if exists
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "IMPORTANT: Log out and log back in for docker group changes to take effect"
echo ""
echo "Next steps:"
echo "1. Edit ~/cvlab/.env.production with your environment variables"
echo "2. Configure GitHub Secrets in your repository"
echo "3. Push to main branch to trigger deployment"
echo ""
echo "GitHub Secrets needed:"
echo "  - EC2_HOST: Your EC2 public IP or domain"
echo "  - EC2_USERNAME: ec2-user (Amazon Linux) or ubuntu (Ubuntu)"
echo "  - EC2_SSH_KEY: Your EC2 private key content"
echo ""
