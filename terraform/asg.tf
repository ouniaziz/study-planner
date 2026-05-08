# asg.tf — Launch Template, Auto Scaling Group (private subnets), and CPU target-tracking scaling policy.

##################################################################
# Latest Amazon Linux 2023 AMI (x86_64, HVM)
##################################################################
data "aws_ami" "amazon_linux_2023" {
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

##################################################################
# Launch Template
# Defines what each backend EC2 looks like when the ASG spins it up.
# user_data is rendered with templatefile() so DB creds are injected
# at plan time — no secrets in the source script.
##################################################################
resource "aws_launch_template" "backend_lt" {
  name_prefix   = "${var.project_name}-backend-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.studyplanner_key.key_name

  # Attach the backend security group (allows 8080 from ALB only)
  vpc_security_group_ids = [aws_security_group.backend_sg.id]

  # Render the startup script with RDS connection details from outputs
  user_data = base64encode(templatefile("${path.module}/user_data_backend.sh", {
    docker_image = var.dockerhub_backend_image
    db_host      = aws_db_instance.studyplanner_db.address
    db_port      = tostring(var.db_port)
    db_name      = var.db_name
    db_user      = var.db_username
    db_pass      = var.db_password
  }))

  # Ensure new instances replace old ones on user_data change
  lifecycle {
    create_before_destroy = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "${var.project_name}-backend"
      Project = var.project_name
    }
  }

  tags = {
    Name    = "${var.project_name}-backend-lt"
    Project = var.project_name
  }
}

##################################################################
# Auto Scaling Group
# Runs backend instances in PRIVATE subnets — never publicly accessible.
# min=2 ensures high availability across 2 AZs at all times.
##################################################################
resource "aws_autoscaling_group" "backend_asg" {
  name                = "${var.project_name}-backend-asg"
  min_size            = 2
  desired_capacity    = 2
  max_size            = 4
  vpc_zone_identifier = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  # Register instances with the ALB Target Group automatically
  target_group_arns = [aws_lb_target_group.backend_tg.arn]

  # Wait for instances to pass the ALB health check before marking healthy
  health_check_type         = "ELB"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.backend_lt.id
    version = "$Latest"
  }

  # Propagate tags to EC2 instances
  dynamic "tag" {
    for_each = {
      Name    = "${var.project_name}-backend"
      Project = var.project_name
    }
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

##################################################################
# CPU Scaling Policy — Target Tracking
# Automatically adds instances when average CPU exceeds 70%.
##################################################################
resource "aws_autoscaling_policy" "cpu_scale_out" {
  name                   = "${var.project_name}-cpu-scaling-policy"
  autoscaling_group_name = aws_autoscaling_group.backend_asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0 # Scale out when average CPU > 70%
  }
}
