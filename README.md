# SG-Happenings
Serverless Bulletin Map of SG for people to share meetups, events, causes &amp; trades for free

## Setup
Backend: 
```
cd backend
npx serverless dev
npx serverless deploy --stage dev (if changes to DynamoDB structure)
```
Frontend:
```
cd frontend
npm run dev
```

Run both backend and frontend together