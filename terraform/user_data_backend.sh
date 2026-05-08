#!/bin/bash
# user_data_backend.sh
# Rendered by templatefile() in asg.tf — Terraform injects docker_image, db_host, db_port, db_name, db_user, db_pass.
# set -e (disabled to prevent boot failure)

# -- Install Docker --
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# -- Pull backend image from DockerHub --
docker pull ${docker_image} || true

# -- Run the Spring Boot container --
# DB credentials injected by Terraform templatefile() — never hardcoded in source.
docker run -d \
  --name studyplanner-backend \
  --restart always \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://${db_host}:${db_port}/${db_name}" \
  -e SPRING_DATASOURCE_USERNAME="${db_user}" \
  -e SPRING_DATASOURCE_PASSWORD="${db_pass}" \
  -e APP_JWT_SECRET="${jwt_secret}" \
  -e SPRING_PROFILES_ACTIVE="prod" \
  ${docker_image} || true
