###############################################################
# main.tf – EC2 + Security Group for Study Planner (free-tier)
###############################################################

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

##################################################################
# Security Group
##################################################################
resource "aws_security_group" "studyplanner_sg" {
  name        = "${var.project_name}-sg"
  description = "Allow SSH, HTTP, frontend (3000) and backend (8080)"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP (nginx)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend (React dev / alternate)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend (Spring Boot)"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-sg"
    Project = var.project_name
  }
}

##################################################################
# Key Pair  (provide the public key via variable or data source)
##################################################################
resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-key"
  public_key = var.ssh_public_key
}

##################################################################
# EC2 Instance
##################################################################
# Resolve the latest Amazon Linux 2023 AMI for the chosen region
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "studyplanner" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.studyplanner_sg.id]

  # Give the instance a public IP automatically
  associate_public_ip_address = true

  # Force EC2 recreation if user_data changes
  user_data_replace_on_change = true

  # Bootstrap: install Docker + Compose plugin, pull nothing yet
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # --- system updates ---
    dnf update -y

    # --- Docker ---
    dnf install -y docker
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user

    # --- Docker Compose plugin (v2) ---
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    # --- AWS CLI (needed for ECR login) ---
    dnf install -y aws-cli

    # --- App directory ---
    mkdir -p /opt/studyplanner
    chown ec2-user:ec2-user /opt/studyplanner

    # --- Generate Environment File ---
    cat << 'ENVEOF' > /opt/studyplanner/.env.production
    POSTGRES_HOST=${aws_db_instance.postgres.address}
    POSTGRES_DB=${var.db_name}
    POSTGRES_USER=${var.db_username}
    POSTGRES_PASSWORD=${var.db_password}
    APP_JWT_SECRET=bXlfc3VwZXJfc2VjcmV0X3N0dWR5X3BsYW5uZXJfa2V5XzEyMzQ1Njc4OQ==
    APP_JWT_EXPIRATION=86400000
    ENVEOF
    
    chmod 600 /opt/studyplanner/.env.production
    chown ec2-user:ec2-user /opt/studyplanner/.env.production
  EOF

  root_block_device {
    volume_size = 30   # AL2023 snapshot requires >= 30 GB
    volume_type = "gp3"
  }

  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}
