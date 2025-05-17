const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Client = require('../models/Client');
const sendEmail = require('../services/email');

// @desc    Create payment intent
// @route   POST /api/payment/create-payment-intent
// @access  Public
exports.createPaymentIntent = async (req, res, next) => {
    try {
        const { customer, serviceDetails, amount } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email: customer.email });
        let isNewUser = false;
        
        // Create user if doesn't exist
        if (!user) {
            const password = crypto.randomBytes(8).toString('hex');
            
            user = await User.create({
                email: customer.email,
                password,
                role: 'client'
            });
            
            // Create client profile
            await Client.create({
                user: user._id,
                firstName: customer.name.split(' ')[0],
                lastName: customer.name.split(' ').slice(1).join(' '),
                phone: customer.phone,
                address: customer.address.line1,
                address2: customer.address.line2,
                city: customer.address.city,
                postalCode: customer.address.postal_code,
                cleaningPreferences: serviceDetails.specialInstructions || ''
            });
            
            // Send welcome email
            const loginUrl = `${process.env.FRONTEND_URL}/login`;
            const message = `
                <h1>Welcome to Timeless Tidy!</h1>
                <p>Your booking for ${serviceDetails.serviceType} has been received.</p>
                <p>Here are your login credentials to access your client dashboard:</p>
                <ul>
                    <li>Email: ${customer.email}</li>
                    <li>Password: ${password}</li>
                </ul>
                <p>You can login here: <a href="${loginUrl}">${loginUrl}</a></p>
                <p>Please change your password after your first login.</p>
            `;
            
            await sendEmail({
                email: customer.email,
                subject: 'Your Timeless Tidy Account Credentials',
                message
            });
            
            isNewUser = true;
        }
        
        // Create Stripe customer if doesn't exist
        let stripeCustomer;
        if (user.stripeCustomerId) {
            stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
        } else {
            stripeCustomer = await stripe.customers.create({
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                address: {
                    line1: customer.address.line1,
                    line2: customer.address.line2 || '',
                    city: customer.address.city,
                    postal_code: customer.address.postal_code,
                    country: customer.address.country || 'GB'
                }
            });
            
            // Save Stripe customer ID to user
            user.stripeCustomerId = stripeCustomer.id;
            await user.save();
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'gbp',
            customer: stripeCustomer.id,
            description: `Cleaning service for ${customer.email}`,
            metadata: {
                serviceType: serviceDetails.serviceType,
                frequency: serviceDetails.frequency,
                bedrooms: serviceDetails.bedrooms,
                bathrooms: serviceDetails.bathrooms,
                userId: user._id.toString(),
                isNewUser: isNewUser.toString()
            }
        });
        
        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
        
    } catch (err) {
        next(new ErrorResponse(err.message, 500));
    }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return next(new ErrorResponse('Payment not completed', 400));
        }
        
        // Here you would typically create a booking record in your database
        // const booking = await Booking.create({ ... });
        
        res.status(200).json({
            success: true,
            data: paymentIntent
        });
        
    } catch (err) {
        next(new ErrorResponse(err.message, 500));
    }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payment/webhook
// @access  Public
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

    // Handle payment success
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Here you would typically:
        // 1. Update your booking record as paid
        // 2. Send confirmation email
        // 3. Notify admin/cleaner about new booking
        
        console.log('Payment succeeded:', paymentIntent.id);
    }

    res.json({ received: true });
};