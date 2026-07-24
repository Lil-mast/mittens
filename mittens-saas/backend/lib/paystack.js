import axios from 'axios'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const PAYSTACK_BASE = 'https://api.paystack.co'

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
})

// Initialize a payment transaction
export const initializeTransaction = async (email, amount, metadata = {}) => {
  const response = await paystackApi.post('/transaction/initialize', {
    email,
    amount: amount * 100, // Paystack uses kobo/cents
    currency: 'KES',
    metadata,
    callback_url: `${process.env.CLIENT_URL}/payment/verify`
  })
  return response.data.data
}

// Verify a transaction
export const verifyTransaction = async (reference) => {
  const response = await paystackApi.get(`/transaction/verify/${reference}`)
  return response.data.data
}

// Create a Paystack customer
export const createCustomer = async (email, name) => {
  const response = await paystackApi.post('/customer', {
    email,
    first_name: name?.split(' ')[0] || '',
    last_name: name?.split(' ')[1] || ''
  })
  return response.data.data
}

// Create a subscription plan (run once)
export const createPlan = async () => {
  const response = await paystackApi.post('/plan', {
    name: 'Mittens Pro',
    interval: 'monthly',
    amount: 999 * 100, // KES 999/month
    currency: 'KES'
  })
  return response.data.data
}

// Subscribe a customer to a plan
export const createSubscription = async (customerId, planCode) => {
  const response = await paystackApi.post('/subscription', {
    customer: customerId,
    plan: planCode
  })
  return response.data.data
}

// Verify webhook signature
export const verifyWebhook = (signature, body) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(body))
    .digest('hex')
  return hash === signature
}