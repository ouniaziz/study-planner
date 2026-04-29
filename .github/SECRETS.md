# GitHub Actions Secrets Required

## Add these in: GitHub repo → Settings → Secrets and variables → Actions

| Secret Name | Description |
|---|---|
| `aziz ouni` | Your Docker Hub username (e.g. `azizuser`) |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token (not your password) — create at https://hub.docker.com/settings/security |
| `3.93.73.67` | EC2 Public IP: **3.93.73.67** |
| `EC2_SSH_PRIVATE_KEY` | Full content of your private key (`~/.ssh/id_rsa` or `studyplanner`) |

> Note: ECR was removed because AWS Academy (Vocareum) restricts ecr:CreateRepository.
> Docker Hub is free and has no sandbox restrictions.
