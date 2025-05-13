// Initialize Stripe with your publishable key
const stripe = Stripe('pk_test_your_test_key_here'); // Replace with your actual test key
let elements;
let cardElement;

// Initialize Stripe Elements when payment step is shown
function initializeStripe() {
    if (!elements) {
        elements = stripe.elements();
        
        const style = {
            base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        };

        cardElement = elements.create('card', { 
            style: style,
            hidePostalCode: true
        });
        cardElement.mount('#card-element');

        // Handle real-time validation errors
        cardElement.addEventListener('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
    }
}

// Handle form submission with Stripe
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    // Validate terms checkbox
    if (!document.getElementById('terms').checked) {
        alert('Please agree to the terms and conditions');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Booking';
        return;
    }

    // Collect all form data
    const formData = {
        customer: {
            name: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('mobile').value,
            address: {
                line1: document.getElementById('address1').value,
                line2: document.getElementById('address2').value || '',
                city: document.getElementById('city').value,
                postal_code: document.getElementById('postal-code-confirm').value,
                country: 'GB' // Assuming UK based
            }
        },
        serviceDetails: {
            bedrooms: document.getElementById('bedrooms').value,
            bathrooms: document.getElementById('bathrooms').value,
            serviceType: 'Standard Cleaning', // Default or from selection
            frequency: document.querySelector('.option-block[data-frequency].selected')?.dataset.frequency || 'one-off',
            workHours: document.querySelector('.option-block[data-hours].selected')?.dataset.hours || '2.0',
            cleaningProducts: document.querySelector('.option-block[data-products].selected')?.dataset.products || 'provide',
            accessMethod: document.querySelector('.option-block[data-access].selected')?.dataset.access || 'someone',
            pets: document.querySelector('.option-block[data-pets].selected')?.dataset.pets || 'no',
            petTypes: Array.from(document.querySelectorAll('.pet-type-option.selected')).map(el => el.dataset.petType),
            selectedDate: document.querySelector('#calendar-days .calendar-day.selected')?.textContent,
            selectedTime: document.querySelector('.time-slot.selected')?.dataset.time,
            specialInstructions: document.getElementById('special-instructions').value || '',
            extraTasks: selectedExtras
        },
        files: uploadedFiles // From your file upload handling
    };

    try {
        // 1. Create Payment Intent on your server
        const response = await fetch('/api/payment/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                amount: calculateTotalAmount(formData) // Calculate total based on your pricing
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Payment processing failed');
        }

        const { clientSecret, paymentIntentId } = await response.json();

        // 2. Confirm the payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: formData.customer
            },
            receipt_email: formData.customer.email
        });

        if (error) {
            throw error;
        }

        // 3. Payment succeeded - verify with your server
        const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
                paymentId: paymentIntentId
            })
        });

        if (!verifyResponse.ok) {
            throw new Error('Payment verification failed');
        }

        // 4. Generate and show invoice
        generateInvoice(paymentIntent);
        document.getElementById('invoice-container').style.display = 'block';
        document.querySelector('.form-container form').style.display = 'none';
        window.scrollTo(0, 0);

    } catch (err) {
        console.error('Payment error:', err);
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = err.message;
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Booking';
    }
}

// Calculate total amount based on form data
function calculateTotalAmount(formData) {
    let total = 50; // Base price
    
    // Add for bedrooms and bathrooms
    total += (parseInt(formData.serviceDetails.bedrooms) || 0) * 15;
    total += (parseInt(formData.serviceDetails.bathrooms) || 0) * 20;
    
    // Add for extra tasks
    formData.serviceDetails.extraTasks.forEach(task => {
        total += task.cost;
    });
    
    // Adjust for frequency
    switch(formData.serviceDetails.frequency) {
        case 'more-than-weekly': total *= 0.9; break; // 10% discount
        case 'weekly': total *= 0.95; break; // 5% discount
        case 'one-off': total *= 1.1; break; // 10% premium
    }
    
    // Convert to cents for Stripe
    return Math.round(total * 100);
}

// Update your form submission event listener
document.getElementById('signup-form').addEventListener('submit', handleFormSubmit);

// Update showStep function to initialize Stripe when reaching payment step
function showStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === stepNumber) {
            step.classList.add('active');
        }
    });
    
    currentStep = stepNumber;
    updateStepIndicator();
    
    // When going to step 3, populate the postal code from step 1
    if (stepNumber === 3) {
        const postalCode = document.getElementById('postal-code').value;
        document.getElementById('postal-code-confirm').value = postalCode;
    }
    
    // Initialize Stripe when reaching payment step
    if (stepNumber === 4) {
        initializeStripe();
    }
}

// Update invoice generation with payment info
function generateInvoice(paymentIntent) {
    const invoiceContainer = document.getElementById('invoice-container');
    const itemsBody = document.getElementById('invoice-items-body');
    
    // Clear previous items
    itemsBody.innerHTML = '';
    
    // Customer details
    document.getElementById('invoice-name').textContent = paymentIntent.billing_details.name;
    document.getElementById('invoice-address').textContent = 
        `${paymentIntent.billing_details.address.line1}, ${paymentIntent.billing_details.address.line2 || ''}, 
         ${paymentIntent.billing_details.address.city}, ${paymentIntent.billing_details.address.postal_code}`;
    document.getElementById('invoice-phone').textContent = paymentIntent.billing_details.phone;
    document.getElementById('invoice-email').textContent = paymentIntent.receipt_email;
    
    // Invoice details
    document.getElementById('invoice-number').textContent = `INV-${paymentIntent.id.slice(-8)}`;
    const invoiceDate = new Date(paymentIntent.created * 1000);
    document.getElementById('invoice-date').textContent = invoiceDate.toLocaleDateString('en-GB');
    
    // Add service items
    const amount = paymentIntent.amount / 100;
    addInvoiceItem(itemsBody, 'Cleaning Service', 1, amount);
    
    // Calculate and display total
    document.getElementById('invoice-total-amount').textContent = `£${amount.toFixed(2)}`;
    
    // Show invoice
    invoiceContainer.style.display = 'block';
}

function addInvoiceItem(container, description, quantity, price) {
    const row = document.createElement('tr');
    
    const descCell = document.createElement('td');
    descCell.textContent = description;
    row.appendChild(descCell);
    
    const qtyCell = document.createElement('td');
    qtyCell.textContent = quantity;
    row.appendChild(qtyCell);
    
    const priceCell = document.createElement('td');
    priceCell.textContent = `£${price.toFixed(2)}`;
    row.appendChild(priceCell);
    
    const totalCell = document.createElement('td');
    totalCell.textContent = `£${(quantity * price).toFixed(2)}`;
    row.appendChild(totalCell);
    
    container.appendChild(row);
}