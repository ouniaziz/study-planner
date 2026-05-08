# alb.tf — Application Load Balancer, Target Group (port 8080 + /health check), and HTTP Listener.

##################################################################
# Application Load Balancer
# Internet-facing, spans both public subnets for high availability.
##################################################################
resource "aws_lb" "studyplanner_alb" {
  name               = "${var.project_name}-alb"
  internal           = false # internet-facing
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  # Prevent accidental deletion during a demo
  enable_deletion_protection = false

  tags = {
    Name    = "${var.project_name}-alb"
    Project = var.project_name
  }
}

##################################################################
# Target Group
# Backend Spring Boot containers listen on port 8080.
# Health check hits GET /health — backend must return HTTP 200.
##################################################################
resource "aws_lb_target_group" "backend_tg" {
  name        = "${var.project_name}-backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.studyplanner_vpc.id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name    = "${var.project_name}-backend-tg"
    Project = var.project_name
  }
}

##################################################################
# Listener — port 80 → forward to backend Target Group
##################################################################
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.studyplanner_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }

  tags = {
    Name    = "${var.project_name}-http-listener"
    Project = var.project_name
  }
}
