# variables.tf — All input variables with descriptions, types, and defaults.

###############################################################
# General
###############################################################
variable "aws_region" {
  description = "AWS region to deploy all resources into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Base name applied to all resource names and tags (Project tag)"
  type        = string
  default     = "studyplanner"
}

###############################################################
# Networking & Access
###############################################################
variable "my_ip" {
  description = "Your public IP in CIDR notation (e.g. 203.0.113.5/32). Used for SSH rules in backend-sg and frontend-sg."
  type        = string
}

###############################################################
# EC2 / Compute
###############################################################
variable "instance_type" {
  description = "EC2 instance type for both backend ASG instances and the frontend EC2"
  type        = string
  default     = "t2.micro"
}

variable "key_pair_name" {
  description = "Name of the AWS Key Pair to attach to all EC2 instances (must match the public key below)"
  type        = string
  default     = "studyplanner-key"
}

variable "ssh_public_key" {
  description = "Contents of your SSH public key file (e.g. ~/.ssh/id_rsa.pub). Used to create the AWS Key Pair."
  type        = string
  # Pass via TF_VAR_ssh_public_key or terraform.tfvars — never commit a real key.
}

###############################################################
# Docker Images
###############################################################
variable "dockerhub_backend_image" {
  description = "DockerHub image reference for the Spring Boot backend (e.g. yourusername/studyplanner-backend:latest)"
  type        = string
}

variable "dockerhub_frontend_image" {
  description = "DockerHub image reference for the React frontend (e.g. yourusername/studyplanner-frontend:latest)"
  type        = string
}

###############################################################
# Database (RDS)
###############################################################
variable "db_name" {
  description = "Name of the PostgreSQL database to create inside the RDS instance"
  type        = string
  default     = "studyplanner"
}

variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance. Pass via terraform.tfvars or TF_VAR_db_password — never hardcode."
  type        = string
  sensitive   = true
}

variable "db_port" {
  description = "Port the PostgreSQL RDS instance listens on"
  type        = number
  default     = 5432
}
