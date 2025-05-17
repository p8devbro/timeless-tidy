const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Client = require('../models/Client');
const sendEmail = require('./email');

// Create Stripe customer and charge
exports.createPayment = async (paymentData) => {
  try {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: paymentData.email,
      name: `${paymentData.firstName} ${paymentData.lastName}`,
      phone: paymentData.phone,
      address: {
        line1: paymentData.address,
        city: paymentData.city,
        state: paymentData.state,
        postal_code: paymentData.zipCode
      }
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount * 100, // Convert to cents
      currency: 'usd',
      customer: customer.id,
      description: `Cleaning service for ${paymentData.serviceType}`,
      metadata: {
        serviceType: paymentData.serviceType,
        frequency: paymentData.frequency,
        squareFootage: paymentData.squareFootage,
        bedrooms: paymentData.bedrooms,
        bathrooms: paymentData.bathrooms
      }
    });

    // Create client account if this is a new customer
    let user;
    if (!paymentData.existingCustomer) {
      // Generate random password
      const password = crypto.randomBytes(8).toString('hex');
      
      // Create user
      user = await User.create({
        email: paymentData.email,
        password,
        role: 'client'
      });

      // Create client profile
      await Client.create({
        user: user._id,
        firstName: paymentData.firstName,
        lastName: paymentData.lastName,
        phone: paymentData.phone,
        address: paymentData.address,
        city: paymentData.city,
        state: paymentData.state,
        zipCode: paymentData.zipCode,
        cleaningPreferences: paymentData.specialInstructions || ''
      });

      // Send welcome email with credentials
      const loginUrl = `${process.env.FRONTEND_URL}/login`;
      const message = `
        <h1>Welcome to Timeless Tidy!</h1>
        <p>Your payment of $${paymentData.amount} for ${paymentData.serviceType} has been processed successfully.</p>
        <p>Here are your login credentials to access your client dashboard:</p>
        <ul>
          <li>Email: ${paymentData.email}</li>
          <li>Password: ${password}</li>
        </ul>
        <p>You can login here: <a href="${loginUrl}">${loginUrl}</a></p>
        <p>Please change your password after your first login.</p>
      `;

      await sendEmail({
        email: paymentData.email,
        subject: 'Your Timeless Tidy Account Credentials',
        message
      });
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      customerId: customer.id,
      userId: user ? user._id : null
    };
  } catch (err) {
    console.error('Stripe error:', err);
    throw new Error(err.message);
  }
};

// Handle Stripe webhook for completed payments
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the payment_intent.succeeded event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('Payment succeeded:', paymentIntent.id);
    // Here you could update your database with the payment confirmation
  }

  res.json({ received: true });
};