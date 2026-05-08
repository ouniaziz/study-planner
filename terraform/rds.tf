# rds.tf — PostgreSQL RDS instance (db.t3.micro, engine 16) in a private DB Subnet Group with rds-sg.

##################################################################
# DB Subnet Group
# RDS must be placed in a subnet group spanning at least 2 AZs.
# Using private subnets — the database is never directly accessible.
##################################################################
resource "aws_db_subnet_group" "studyplanner_db_subnet_group" {
  name        = "${var.project_name}-db-subnet-group"
  description = "Private subnet group for StudyPlanner RDS - no public access"
  subnet_ids  = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name    = "${var.project_name}-db-subnet-group"
    Project = var.project_name
  }
}

##################################################################
# RDS PostgreSQL Instance
# - Engine: PostgreSQL 16
# - Class:  db.t3.micro
# - Not publicly accessible (VPC-internal only)
# - Password passed via variable / terraform.tfvars — never hardcoded
##################################################################
resource "aws_db_instance" "studyplanner_db" {
  identifier        = "${var.project_name}-db"
  allocated_storage = 20
  storage_type      = "gp2"

  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t3.micro"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password # supplied via terraform.tfvars or TF_VAR_db_password

  parameter_group_name = "default.postgres16"

  # Place RDS in the private subnet group
  db_subnet_group_name = aws_db_subnet_group.studyplanner_db_subnet_group.name

  # Only backend-sg may connect — no internet access
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false # critical: database is never internet-facing

  skip_final_snapshot = true

  tags = {
    Name    = "${var.project_name}-db"
    Project = var.project_name
  }
}
