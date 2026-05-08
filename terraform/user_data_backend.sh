#!/bin/bash
# user_data_backend.sh
# Rendered by templatefile() in asg.tf — Terraform injects docker_image, db_host, db_port, db_name, db_user, db_pass.
set -e

# -- System updates --
dnf update -y

# -- Install Docker --
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# -- Pull backend image from DockerHub --
docker pull ${docker_image}

# -- Run the Spring Boot container --
# DB credentials injected by Terraform templatefile() — never hardcoded in source.
docker run -d \
  --name studyplanner-backend \
  --restart always \
  -p 8080:8080 \
  -e DB_HOST="${db_host}" \
  -e DB_PORT="${db_port}" \
  -e DB_NAME="${db_name}" \
  -e DB_USER="${db_user}" \
  -e DB_PASS="${db_pass}" \
  ${docker_image}
