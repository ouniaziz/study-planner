#!/bin/bash
# user_data_frontend.sh
# Rendered by templatefile() in frontend.tf — Terraform injects frontend_image and alb_dns.
# Note: nginx variables ($$host, $$remote_addr, etc.) use $$ so Terraform leaves them as literal $ signs.
# # set -e (disabled to prevent boot failure) (disabled to prevent boot failure if images aren't pushed yet)

# -- System updates --
dnf update -y

# -- Install Docker and Docker Compose --
dnf install -y docker docker-compose-plugin
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# -- Install nginx --
dnf install -y nginx
systemctl enable nginx

# -- Prepare deployment directory --
mkdir -p /home/ec2-user/studyplanner
chown ec2-user:ec2-user /home/ec2-user/studyplanner

# -- Pull and run the React frontend container --
docker pull ${frontend_image} || true || true
docker run -d \
  --name studyplanner-frontend \
  --restart always \
  -p 3000:80 \
  ${frontend_image} || true || true

# -- Configure nginx --
# /      -> React app in Docker on port 3000
# /api/  -> ALB DNS name (proxied at nginx level, never a hardcoded EC2 IP)
cat > /etc/nginx/conf.d/studyplanner.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $$host;
        proxy_set_header   X-Real-IP $$remote_addr;
        proxy_set_header   X-Forwarded-For $$proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass         http://${alb_dns}/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host ${alb_dns};
        proxy_set_header   X-Real-IP $$remote_addr;
        proxy_set_header   X-Forwarded-For $$proxy_add_x_forwarded_for;
    }
}
NGINX

# Remove default config to avoid port conflicts
rm -f /etc/nginx/conf.d/default.conf

# -- Start nginx --
systemctl start nginx
