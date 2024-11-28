import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const app = express();

// Create custom axios instance with longer timeout and keep-alive
const apiClient = axios.create({
  timeout: 30000, // 30 seconds timeout
  httpsAgent: new https.Agent({ 
    keepAlive: true,
    rejectUnauthorized: false // Only if dealing with self-signed certificates
  }),
  maxRedirects: 5,
  validateStatus: status => status >= 200 && status < 500 // Handle all responses
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const USER_TOKEN = process.env.USER_TOKEN || '6ec2df9eb3879d64d1b4b3a020604a37';
const API_BASE_URL = 'https://imb.org.in/api';

// Request validation middleware
const validateOrderRequest = (req, res, next) => {
  const { customer_mobile, amount } = req.body;
  
  if (!customer_mobile || !amount) {
    return res.status(400).json({
      status: false,
      message: 'Missing required fields: customer_mobile and amount are required'
    });
  }

  if (!/^\d{10}$/.test(customer_mobile)) {
    return res.status(400).json({
      status: false,
      message: 'Invalid mobile number format. Must be 10 digits'
    });
  }

  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      status: false,
      message: 'Invalid amount. Must be a positive number'
    });
  }

  next();
};

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../dist')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.post('/api/create-order', validateOrderRequest, async (req, res) => {
  try {
    const { customer_mobile, amount, remark1 } = req.body;
    
    // Generate a unique order ID (timestamp + random number)
    const orderId = `ORDER${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    const payload = {
      customer_mobile,
      user_token: USER_TOKEN,
      amount: amount.toString(),
      order_id: orderId,
      redirect_url: `${req.protocol}://${req.get('host')}/payment/callback`,
      remark1: remark1 || '',
      remark2: 'Recharge Payment'
    };

    console.log('Creating order with payload:', payload);

    const response = await apiClient.post(`${API_BASE_URL}/create-order`, new URLSearchParams(payload), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    console.log('Order creation response:', response.data);

    if (response.data.status === true && response.data.result?.payment_url) {
      // Validate and sanitize the payment URL
      const paymentUrl = new URL(response.data.result.payment_url);
      if (!paymentUrl.protocol.startsWith('http')) {
        throw new Error('Invalid payment URL protocol');
      }
      res.json({
        status: true,
        message: 'Order created successfully',
        result: {
          orderId: response.data.result.orderId,
          payment_url: paymentUrl.toString()
        }
      });
    } else {
      throw new Error(response.data.message || 'Invalid response from payment gateway');
    }
  } catch (error) {
    console.error('Error creating order:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({
      status: false,
      message: error.response?.data?.message || error.message || 'Failed to create order'
    });
  }
});

app.get('/api/check-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Order ID is required'
      });
    }

    const payload = {
      user_token: USER_TOKEN,
      order_id: orderId
    };

    console.log('Checking order status for:', orderId);

    const response = await apiClient.post(`${API_BASE_URL}/check-order-status`, new URLSearchParams(payload), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    console.log('Status check response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error checking order status:', error.message);
    res.status(500).json({
      status: 'ERROR',
      message: error.response?.data?.message || error.message || 'Failed to check order status'
    });
  }
});

// Payment callback route
app.get('/payment/callback', (req, res) => {
  console.log('Payment callback received:', req.query);
  res.sendFile(join(__dirname, '../dist/index.html'));
});

// Catch-all route to handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: false,
    message: 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
});