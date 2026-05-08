# README.md — StudyPlanner Terraform Infrastructure

# StudyPlanner — Terraform Infrastructure

A production-grade AWS infrastructure for the StudyPlanner full-stack app, built with Terraform.

## Architecture Overview

```
Internet
   │
   ▼
[Frontend EC2] ─────────────────────────────────────────────►  React App (nginx, port 80)
   │  nginx proxies /api/ calls
   ▼
[ALB] ──── public-a / public-b ──────────────────────────────  HTTP :80
   │
   ▼
[Auto Scaling Group] ── private-a / private-b ──────────────  Spring Boot :8080 (min 2, max 4)
   │
   ▼
[RDS PostgreSQL 16] ── private-a / private-b ───────────────  Port 5432 (no public access)
```

**NAT Gateway** in `public-a` allows backend EC2s and RDS (in private subnets) to reach the internet for Docker pulls and patches — without being directly accessible.

---

## File Structure

| File | Purpose |
|---|---|
| `main.tf` | Terraform version constraint and AWS provider block only |
| `vpc.tf` | VPC (10.0.0.0/16), 4 subnets, Internet Gateway, NAT Gateway, route tables |
| `security_groups.tf` | 4 strict security groups: `alb-sg`, `backend-sg`, `rds-sg`, `frontend-sg` |
| `alb.tf` | Application Load Balancer, Target Group (port 8080, `/health`), HTTP Listener |
| `asg.tf` | Launch Template (AL2023), Auto Scaling Group (min=2, max=4), CPU scaling policy |
| `frontend.tf` | Single frontend EC2 in public-a running React via nginx |
| `rds.tf` | PostgreSQL 16 RDS in a private DB Subnet Group, not publicly accessible |
| `variables.tf` | All input variables with descriptions and types |
| `outputs.tf` | ALB DNS name, frontend public IP, RDS endpoint |
| `terraform.tfvars` | **Your real values** (gitignored — never commit) |
| `terraform.tfvars.example` | Safe template to share in Git |
| `user_data_backend.sh` | Backend EC2 startup: installs Docker, pulls image, runs with DB env vars |
| `user_data_frontend.sh` | Frontend EC2 startup: installs Docker + nginx, proxies API to ALB |

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- AWS CLI configured (`aws configure`) with sufficient IAM permissions
- DockerHub images built and pushed for both backend and frontend
- Your SSH public key available

---

## Deploy Step by Step

### 1. Configure your variables

```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `my_ip` — your public IP from https://whatismyip.com (format: `"1.2.3.4/32"`)
- `dockerhub_backend_image` — e.g. `"yourusername/studyplanner-backend:latest"`
- `dockerhub_frontend_image` — e.g. `"yourusername/studyplanner-frontend:latest"`
- `db_password` — a strong password (or use `export TF_VAR_db_password=...`)
- `ssh_public_key` — contents of your `~/.ssh/id_rsa.pub`

### 2. Initialize Terraform

```bash
terraform init
```

Downloads the AWS provider and sets up the backend.

### 3. Review the plan

```bash
terraform plan
```

You should see approximately **~30 resources to create**: VPC, subnets, IGW, NAT GW, EIP, route tables, 4 SGs, ALB, Target Group, Listener, Launch Template, ASG, scaling policy, frontend EC2, key pair, DB subnet group, RDS.

### 4. Apply

```bash
terraform apply
```

Type `yes` when prompted. **This takes 10–15 minutes** — RDS provisioning is the slowest step.

### 5. Check the outputs

After apply completes, Terraform prints:

```
alb_dns_name        = "studyplanner-alb-XXXX.us-east-1.elb.amazonaws.com"
frontend_public_ip  = "54.x.x.x"
frontend_ssh_command = "ssh -i <key> ec2-user@54.x.x.x"
rds_endpoint        = "studyplanner-db.XXXX.us-east-1.rds.amazonaws.com:5432"
```

---

## Expected Outputs

| Output | Value | How to use |
|---|---|---|
| `alb_dns_name` | ALB DNS | Test backend: `curl http://<alb_dns>/health` |
| `frontend_public_ip` | EC2 public IP | Open `http://<frontend_ip>` in a browser |
| `rds_endpoint` | `host:port` | Internal only — reachable from backend EC2s |

---

## Security Model

| Component | Subnet | Accessible from |
|---|---|---|
| ALB | Public (a + b) | Internet (port 80 only) |
| Backend EC2s | **Private** (a + b) | ALB only (port 8080) |
| RDS | **Private** (a + b) | Backend EC2s only (port 5432) |
| Frontend EC2 | Public (a) | Internet (port 80); your IP only (SSH) |

---

## Tear Down (After Demo)

```bash
terraform destroy
```

> ⚠️ This removes ALL resources including the RDS database. Backup any data first.

**Cost reminder:** The NAT Gateway (~$32/month) and ALB (~$16/month) are the largest cost drivers. Always destroy when not in use.

---

## Tags

Every resource is tagged with `Project = "studyplanner"` for easy cost tracking and filtering in the AWS Console.
