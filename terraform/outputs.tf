# outputs.tf — Key infrastructure endpoints exposed after terraform apply.

##################################################################
# ALB DNS Name — use this URL to reach the backend API
##################################################################
output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer. Use this to reach the backend API."
  value       = aws_lb.studyplanner_alb.dns_name
}

##################################################################
# Frontend Public IP — use this to access the React web app
##################################################################
output "frontend_public_ip" {
  description = "Public IP address of the frontend EC2 instance. Open http://<this-ip> in your browser."
  value       = aws_instance.studyplanner_frontend.public_ip
}

##################################################################
# Frontend SSH command — handy during the demo
##################################################################
output "frontend_ssh_command" {
  description = "SSH command to connect to the frontend EC2 instance."
  value       = "ssh -i <path-to-private-key> ec2-user@${aws_instance.studyplanner_frontend.public_ip}"
}

##################################################################
# RDS Endpoint — internal connection string for the database
##################################################################
output "rds_endpoint" {
  description = "RDS PostgreSQL connection endpoint (host:port). Only reachable from inside the VPC."
  value       = aws_db_instance.studyplanner_db.endpoint
}
