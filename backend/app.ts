import express from 'express';
import type { Request, Response } from 'express'; 
import cors from 'cors';
import serverlessExpress from '@codegenie/serverless-express';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: "Hello from your TypeScript Lambda Express backend!" });
});

export const handler = serverlessExpress({ app });