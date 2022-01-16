# market-tracker-api

The backend API service for the Market Tracker application.

## Client Secret Setup

The production Client Secret needs to be stored in a Kubernetes secret.

```bash
kubectl create secret generic market-tracker-api-client-secret --from-literal=client-secret=######
```

## Running Locally

Simply start the app with `yarn start`