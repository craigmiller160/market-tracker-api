# market-tracker-api

The backend API service for the Market Tracker application.

## Tradier API Key Setup

The application uses the Tradier service to get Stock Market data. This requires an API Key, which must be provided in a private way.

### Local Setup

Add a file called `.env.private` containing:

```
TRADIER_API_KEY=######
```

## Running Locally

The MongoDB root password must be on the host system with the environment variable `MONGO_ROOT_PASSWORD`.

Then, simply start the app with `yarn start`.