###############################################################
# variables.tf
###############################################################

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Base name used for all resources"
  type        = string
  default     = "studyplanner"
}

variable "instance_type" {
  description = "EC2 instance type (t2.micro is free-tier eligible)"
  type        = string
  default     = "t2.micro"
}

variable "ssh_public_key" {
  description = "SSH public key content (e.g. contents of ~/.ssh/id_rsa.pub)"
  type        = string
  # Do NOT commit a real key here. Pass via TF_VAR_ssh_public_key env var
  # or a terraform.tfvars file (gitignored).
}

variable "db_name" {
  description = "The name of the database to create"
  type        = string
  default     = "studyplanner"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
