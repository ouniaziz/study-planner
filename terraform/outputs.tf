###############################################################
# outputs.tf
###############################################################

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.studyplanner.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.studyplanner.public_dns
}

output "ssh_connect_command" {
  description = "One-liner to SSH into the instance"
  value       = "ssh -i <path-to-private-key> ec2-user@${aws_instance.studyplanner.public_ip}"
}

output "ecr_backend_url" {
  description = "ECR repository URL for the backend image"
  value       = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/studyplanner-backend"
}

output "ecr_frontend_url" {
  description = "ECR repository URL for the frontend image"
  value       = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/studyplanner-frontend"
}
