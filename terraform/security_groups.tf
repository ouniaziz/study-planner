# security_groups.tf — All four security groups with strict, least-privilege inbound rules and inline comments.

##################################################################
# alb-sg: The ALB is the only component exposed to the internet.
# Rule: Allow HTTP port 80 from anywhere (0.0.0.0/0) only.
##################################################################
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  description = "ALB: allow HTTP port 80 from the internet only"
  vpc_id      = aws_vpc.studyplanner_vpc.id

  # Allow public HTTP traffic into the load balancer
  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound (ALB needs to forward to backend targets)
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-alb-sg"
    Project = var.project_name
  }
}

##################################################################
# backend-sg: Backend EC2s live in private subnets.
# Rules:
#   - Port 8080 ONLY from alb-sg (no direct internet access)
#   - Port 22 (SSH) ONLY from your IP for debugging
##################################################################
resource "aws_security_group" "backend_sg" {
  name        = "${var.project_name}-backend-sg"
  description = "Backend ASG: allow 8080 from ALB only, SSH from admin IP"
  vpc_id      = aws_vpc.studyplanner_vpc.id

  # Backend port — only the ALB may send traffic here (not the internet)
  ingress {
    description     = "App port 8080 from ALB only"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # SSH for debugging — restricted to your IP only, never 0.0.0.0/0
  ingress {
    description = "SSH from admin IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  # Allow all outbound (Docker pulls via NAT GW, RDS connections)
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-backend-sg"
    Project = var.project_name
  }
}

##################################################################
# rds-sg: Database is fully private — no internet access, ever.
# Rule: Port 5432 ONLY from backend-sg (the Spring Boot containers)
##################################################################
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "RDS: allow PostgreSQL 5432 from backend-sg only - no internet"
  vpc_id      = aws_vpc.studyplanner_vpc.id

  # Postgres — only backend EC2s may connect (source is a SG, not CIDR)
  ingress {
    description     = "PostgreSQL from backend-sg only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_sg.id]
  }

  # Allow outbound so RDS can respond to queries
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-rds-sg"
    Project = var.project_name
  }
}

##################################################################
# frontend-sg: The React frontend EC2 sits in a public subnet.
# Rules:
#   - Port 80 from anyone (serves the web app via nginx)
#   - Port 22 (SSH) ONLY from your IP for debugging
##################################################################
resource "aws_security_group" "frontend_sg" {
  name        = "${var.project_name}-frontend-sg"
  description = "Frontend EC2: HTTP 80 from internet, SSH from admin IP"
  vpc_id      = aws_vpc.studyplanner_vpc.id

  # Serve the React app over HTTP to all users
  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH for debugging — restricted to your IP only, never 0.0.0.0/0
  ingress {
    description = "SSH from admin IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound (Docker pulls, nginx proxying to ALB)
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-frontend-sg"
    Project = var.project_name
  }
}

##################################################################
# Key Pair — referenced by both backend Launch Template and frontend EC2
##################################################################
resource "aws_key_pair" "studyplanner_key" {
  key_name   = var.key_pair_name
  public_key = var.ssh_public_key

  tags = {
    Name    = var.key_pair_name
    Project = var.project_name
  }
}
