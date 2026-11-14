# Kubernetes deployment

| URL | Goes to |
|-----|---------|
| https://www.webapps.jfn.ac.lk/mangrove-guard/ | `mangrove-guard-client` (nginx, static React build) |
| https://www.webapps.jfn.ac.lk/mangrove-guard/api/… | `mangrove-guard-server` (Express + Socket.io), rewritten to `/api/…` |

- Namespace: `webapps-mangrove-guard`
- MongoDB: external, `192.168.222.59` (connection string in the secret)
- Images: built by [.github/workflows/docker-images.yml](../.github/workflows/docker-images.yml) on every push to `main`:
  `ghcr.io/uoj-lk/mangroveguard/server:latest` and `ghcr.io/uoj-lk/mangroveguard/client:latest` (plus `sha-<commit>` tags)
- No persistent volumes: the app stores everything in MongoDB.

## Files

| File | What |
|------|------|
| `00-namespace.yaml` | Namespace |
| `01-configmap.yaml` | Non-secret server env (`CLIENT_URL`, email host, cooldowns…) |
| `secret.example.yaml` | Template for `mangrove-guard-secret` (`MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`). **Not applied by kustomize.** |
| `10-server.yaml` | API Deployment + Service (1 replica, see below) |
| `20-client.yaml` | Web Deployment + Service |
| `30-ingress.yaml` | Two ingresses (api + web) with cert-manager TLS |

## First-time setup

```bash
kubectl apply -f k8s/00-namespace.yaml

# 1. GHCR pull secret (PAT with read:packages)
kubectl -n webapps-mangrove-guard create secret docker-registry github-secret \
  --docker-server=ghcr.io \
  --docker-username=<github-user> \
  --docker-password=<github-pat>

# 2. App secret
kubectl -n webapps-mangrove-guard create secret generic mangrove-guard-secret \
  --from-literal=MONGO_URI='mongodb://<user>:<password>@192.168.222.59:27017/mangroveguard?authSource=admin' \
  --from-literal=JWT_SECRET="$(openssl rand -base64 48)" \
  --from-literal=EMAIL_USER='' \
  --from-literal=EMAIL_PASS=''

# 3. Everything else
kubectl apply -k k8s
kubectl -n webapps-mangrove-guard get pods,ingress
```

The MongoDB server must accept connections from the cluster nodes' network
(`bindIp` and firewall on 192.168.222.59), and the database user needs
`readWrite` on the app database.

## Deploying a new version

The deployments use `:latest` with `imagePullPolicy: Always`, so after the
GitHub Action finishes:

```bash
kubectl -n webapps-mangrove-guard rollout restart deploy/mangrove-guard-server deploy/mangrove-guard-client
kubectl -n webapps-mangrove-guard rollout status deploy/mangrove-guard-server
```

To pin or roll back, set a specific tag:
`kubectl -n webapps-mangrove-guard set image deploy/mangrove-guard-server server=ghcr.io/uoj-lk/mangroveguard/server:sha-<commit>`

Changing the ConfigMap or Secret also needs a `rollout restart` (env is read at start).

## Seeding demo data (first install only)

`seed.js` **deletes all users, sites, devices, readings and alerts** before
inserting demo data, and refuses to run when `NODE_ENV=production`. Only use it
on an empty database:

```bash
kubectl -n webapps-mangrove-guard exec deploy/mangrove-guard-server -- \
  env NODE_ENV=development node seed.js
```

Change the demo passwords (`admin123` / `user123`) right after.

## Why the server runs a single replica

The server runs an in-process watchdog (offline alerts, emails, SMS), keeps
rate-limit counters in memory, and Socket.io long-polling needs sticky
sessions. A second replica would send duplicate alerts. For ~100 users one pod
at 25m CPU / 128Mi request (256Mi limit) is plenty.

## Logs

```bash
kubectl -n webapps-mangrove-guard logs deploy/mangrove-guard-server -f
```
