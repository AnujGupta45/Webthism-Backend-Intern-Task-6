import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { setupSwagger } from './utils/swagger';

const app = express();

app.use(cors());

// Parse JSON request bodies, and preserve raw body buffer for Stripe webhook verification
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

setupSwagger(app);

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use(errorHandler);

export default app;
