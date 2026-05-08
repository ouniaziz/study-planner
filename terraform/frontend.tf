# frontend.tf — Single frontend EC2 instance in public-a, running React via nginx proxying to the ALB.

##################################################################
# Frontend EC2 Instance
# Public subnet so users can reach it directly.
# nginx serves React on port 80 and proxies /api/ calls to the ALB.
##################################################################
resource "aws_instance" "studyplanner_frontend" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.studyplanner_key.key_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.frontend_sg.id]

  # Public IP assigned automatically (it's in a public subnet)
  associate_public_ip_address = true

  # Force instance recreation if the startup script changes
  user_data_replace_on_change = true

  # Render the startup script with the ALB DNS name and frontend image
  user_data = templatefile("${path.module}/user_data_frontend.sh", {
    frontend_image = var.dockerhub_frontend_image
    alb_dns        = aws_lb.studyplanner_alb.dns_name
  })

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "${var.project_name}-frontend"
    Project = var.project_name
  }
}
