#!/bin/bash
# user_data_frontend.sh
# Simplified to ensure Docker is installed quickly for GitHub Actions deployment.

# -- System updates (optional, skipped for speed on t2.micro) --
# dnf update -y

# -- Install Docker --
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# -- Install Nginx --
# We install it so the GitHub Action can stop it to free up port 80.
dnf install -y nginx
systemctl enable nginx
systemctl start nginx
