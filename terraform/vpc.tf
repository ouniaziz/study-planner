# vpc.tf — VPC, subnets (public/private across 2 AZs), Internet Gateway, NAT Gateway, and route tables.

##################################################################
# VPC
##################################################################
resource "aws_vpc" "studyplanner_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "${var.project_name}-vpc"
    Project = var.project_name
  }
}

##################################################################
# Subnets — Public (internet-facing: ALB, frontend EC2)
##################################################################
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.studyplanner_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.project_name}-public-a"
    Project = var.project_name
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.studyplanner_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.project_name}-public-b"
    Project = var.project_name
  }
}

##################################################################
# Subnets — Private (backend EC2s via ASG, RDS — no direct internet)
##################################################################
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.studyplanner_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name    = "${var.project_name}-private-a"
    Project = var.project_name
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.studyplanner_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name    = "${var.project_name}-private-b"
    Project = var.project_name
  }
}

##################################################################
# Internet Gateway — allows public subnets to reach the internet
##################################################################
resource "aws_internet_gateway" "studyplanner_igw" {
  vpc_id = aws_vpc.studyplanner_vpc.id

  tags = {
    Name    = "${var.project_name}-igw"
    Project = var.project_name
  }
}

##################################################################
# NAT Gateway — allows private subnets to reach the internet
# (for Docker pulls, package installs) without being exposed.
# Placed in public-a with a dedicated Elastic IP.
##################################################################
resource "aws_eip" "nat_eip" {
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-nat-eip"
    Project = var.project_name
  }
}

resource "aws_nat_gateway" "studyplanner_nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_a.id

  # NAT GW must be created after the IGW is attached
  depends_on = [aws_internet_gateway.studyplanner_igw]

  tags = {
    Name    = "${var.project_name}-nat-gw"
    Project = var.project_name
  }
}

##################################################################
# Route Table — Public (0.0.0.0/0 → Internet Gateway)
##################################################################
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.studyplanner_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.studyplanner_igw.id
  }

  tags = {
    Name    = "${var.project_name}-public-rt"
    Project = var.project_name
  }
}

resource "aws_route_table_association" "public_a_assoc" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_b_assoc" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

##################################################################
# Route Table — Private (0.0.0.0/0 → NAT Gateway)
##################################################################
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.studyplanner_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.studyplanner_nat.id
  }

  tags = {
    Name    = "${var.project_name}-private-rt"
    Project = var.project_name
  }
}

resource "aws_route_table_association" "private_a_assoc" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_b_assoc" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private_rt.id
}
