        let currentStep = 1;
        const totalSteps = 4;
        let selectedExtras = [];
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        
        // Initialize the form
        document.addEventListener('DOMContentLoaded', function() {
            updateStepIndicator();
            generateTimeSlots();
            generateCalendar();
            setupEventListeners();
            
            // Set minimum date for date picker to today
            const today = new Date().toISOString().split('T')[0];
            if (document.getElementById('cleaning-date')) {
                document.getElementById('cleaning-date').min = today;
            }
        });
        
        function setupEventListeners() {
            // Extra tasks selection
            document.querySelectorAll('.extra-task-option').forEach(option => {
                option.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    updateSelectedExtras();
                    updateSummary();
                });
            });
            
            // Option blocks selection
            document.querySelectorAll('.option-block').forEach(block => {
                block.addEventListener('click', function() {
                    // Remove selected class from siblings
                    this.parentElement.querySelectorAll('.option-block').forEach(b => {
                        b.classList.remove('selected');
                    });
                    // Add to clicked element
                    this.classList.add('selected');
                    
                    // Special handling for pet options
                    if (this.dataset.pets === 'yes') {
                        document.getElementById('pet-types-container').style.display = 'block';
                    } else if (this.dataset.pets === 'no') {
                        document.getElementById('pet-types-container').style.display = 'none';
                    }
                    
                    // Special handling for access options
                    if (this.dataset.access) {
                        showAccessDetails(this.dataset.access);
                    }
                    
                    updateSummary();
                });
            });
            
            // Pet type selection
            document.querySelectorAll('.pet-type-option').forEach(option => {
                option.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
            });
            
            // Calendar navigation
            document.getElementById('prev-month').addEventListener('click', function() {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                generateCalendar();
            });
            
            document.getElementById('next-month').addEventListener('click', function() {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                generateCalendar();
            });
            
            // Time slot selection
            document.querySelectorAll('.time-slot').forEach(slot => {
                slot.addEventListener('click', function() {
                    // Remove selected class from siblings in same container
                    this.parentElement.querySelectorAll('.time-slot').forEach(s => {
                        s.classList.remove('selected');
                    });
                    // Add to clicked element
                    this.classList.add('selected');
                    updateSummary();
                });
            });
            
            // Update work hours recommendation when bedrooms/bathrooms change
            document.getElementById('bedrooms').addEventListener('change', updateWorkHoursRecommendation);
            document.getElementById('bathrooms').addEventListener('change', updateWorkHoursRecommendation);
            
            // Update summary when inputs change
            document.getElementById('bedrooms').addEventListener('change', updateSummary);
            document.getElementById('bathrooms').addEventListener('change', updateSummary);
        }
        
        function toggleOrderSummary() {
            const dropdown = document.querySelector('.order-summary-dropdown');
            const toggle = document.querySelector('.order-summary-toggle');
            
            dropdown.classList.toggle('active');
            toggle.classList.toggle('active');
        }
        
        function updateSelectedExtras() {
            selectedExtras = [];
            document.querySelectorAll('.extra-task-option.selected').forEach(option => {
                selectedExtras.push({
                    name: option.querySelector('div').textContent,
                    cost: parseFloat(option.dataset.cost)
                });
            });
        }
        
        function updateWorkHoursRecommendation() {
            const bedrooms = parseInt(document.getElementById('bedrooms').value) || 0;
            const bathrooms = parseInt(document.getElementById('bathrooms').value) || 0;
            
            if (bedrooms > 0 || bathrooms > 0) {
                // Base hours calculation
                let recommendedHours = 2.0; // Base
                recommendedHours += bedrooms * 0.5;
                recommendedHours += bathrooms * 0.5;
                
                // Add extra time for selected extras
                selectedExtras.forEach(extra => {
                    recommendedHours += 0.5; // Add 30 minutes per extra task
                });
                
                // Round to nearest 0.5
                recommendedHours = Math.round(recommendedHours * 2) / 2;
                
                // Ensure it's within our range
                recommendedHours = Math.max(2.0, Math.min(8.0, recommendedHours));
                
                document.getElementById('work-hours-recommendation').textContent = 
                    `Recommended: ${recommendedHours} hours based on your selection`;
                
                // Highlight the recommended option
                document.querySelectorAll('.option-block[data-hours]').forEach(block => {
                    block.classList.remove('recommended');
                    if (parseFloat(block.dataset.hours) === recommendedHours) {
                        block.classList.add('recommended');
                        block.style.borderColor = 'var(--primary-color)';
                        block.style.boxShadow = '0 0 0 2px rgba(74, 111, 165, 0.2)';
                    }
                });
            } else {
                document.getElementById('work-hours-recommendation').textContent = '';
            }
        }
        
        function showAccessDetails(accessMethod) {
            const detailsContainer = document.getElementById('access-details-container');
            const conciergeDetails = document.getElementById('concierge-details');
            const keysafeDetails = document.getElementById('keysafe-details');
            const hiddenDetails = document.getElementById('hidden-details');
            
            // Hide all first
            conciergeDetails.style.display = 'none';
            keysafeDetails.style.display = 'none';
            hiddenDetails.style.display = 'none';
            
            // Show the appropriate one
            if (accessMethod === 'concierge') {
                detailsContainer.style.display = 'block';
                conciergeDetails.style.display = 'block';
            } else if (accessMethod === 'keysafe') {
                detailsContainer.style.display = 'block';
                keysafeDetails.style.display = 'block';
            } else if (accessMethod === 'hidden') {
                detailsContainer.style.display = 'block';
                hiddenDetails.style.display = 'block';
            } else {
                detailsContainer.style.display = 'none';
            }
        }
        
        function generateTimeSlots() {
            const morningSlots = document.getElementById('morning-slots');
            const afternoonSlots = document.getElementById('afternoon-slots');
            
            // Clear existing slots
            morningSlots.innerHTML = '';
            afternoonSlots.innerHTML = '';
            
            // Generate morning slots (9:00am - 12:00pm in 30-minute intervals)
            let time = new Date();
            time.setHours(9, 0, 0, 0);
            
            const endMorning = new Date();
            endMorning.setHours(12, 0, 0, 0);
            
            while (time <= endMorning) {
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                
                const endTime = new Date(time.getTime() + 30 * 60000);
                const timeString = `${time.getHours()}:${time.getMinutes() === 0 ? '00' : '30'}-${endTime.getHours()}:${endTime.getMinutes() === 0 ? '00' : '30'}${time.getHours() >= 12 ? 'pm' : 'am'}`;
                
                slot.textContent = timeString;
                slot.dataset.time = timeString;
                
                morningSlots.appendChild(slot);
                
                time = new Date(time.getTime() + 30 * 60000);
            }
            
            // Generate afternoon slots (12:00pm - 5:00pm in 30-minute intervals)
            time.setHours(12, 0, 0, 0);
            const endAfternoon = new Date();
            endAfternoon.setHours(17, 0, 0, 0);
            
            while (time <= endAfternoon) {
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                
                const endTime = new Date(time.getTime() + 30 * 60000);
                const timeString = `${time.getHours()}:${time.getMinutes() === 0 ? '00' : '30'}-${endTime.getHours()}:${endTime.getMinutes() === 0 ? '00' : '30'}pm`;
                
                slot.textContent = timeString;
                slot.dataset.time = timeString;
                
                afternoonSlots.appendChild(slot);
                
                time = new Date(time.getTime() + 30 * 60000);
            }
        }
        
        function generateCalendar() {
            const calendarDays = document.getElementById('calendar-days');
            const monthYearDisplay = document.getElementById('current-month-year');
            
            // Clear existing calendar days
            calendarDays.innerHTML = '';
            
            // Set month and year display
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
            
            // Get first day of month and total days in month
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            // Get today's date for comparison
            const today = new Date();
            const currentDate = today.getDate();
            const currentMonthNow = today.getMonth();
            const currentYearNow = today.getFullYear();
            
            // Add empty cells for days before the first day of the month
            for (let i = 0; i < firstDay; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day disabled';
                emptyCell.textContent = '';
                calendarDays.appendChild(emptyCell);
            }
            
            // Add cells for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = day;
                
                // Disable past dates
                if (currentYear > currentYearNow || 
                    (currentYear === currentYearNow && currentMonth > currentMonthNow) ||
                    (currentYear === currentYearNow && currentMonth === currentMonthNow && day >= currentDate)) {
                    dayCell.addEventListener('click', function() {
                        document.querySelectorAll('#calendar-days .calendar-day').forEach(cell => {
                            cell.classList.remove('selected');
                        });
                        this.classList.add('selected');
                        updateSummary();
                    });
                } else {
                    dayCell.classList.add('disabled');
                }
                
                calendarDays.appendChild(dayCell);
            }
        }
        
        function updateStepIndicator() {
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active', 'completed');
                const stepNumber = parseInt(step.dataset.step);
                
                if (stepNumber === currentStep) {
                    step.classList.add('active');
                } else if (stepNumber < currentStep) {
                    step.classList.add('completed');
                }
            });
            
            // Show/hide security info in sidebar
            if (currentStep === 4) {
                document.getElementById('security-container').style.display = 'block';
            } else {
                document.getElementById('security-container').style.display = 'none';
            }
        }
        
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
        
        function nextStep() {
            if (validateStep(currentStep)) {
                updateSummary();
                if (currentStep < totalSteps) {
                    showStep(currentStep + 1);
                }
            }
        }
        
        function prevStep() {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        }
        
        function validateStep(step) {
            // Step 1 validation
            if (step === 1) {
                const postalCode = document.getElementById('postal-code').value;
                const bedrooms = document.getElementById('bedrooms').value;
                const bathrooms = document.getElementById('bathrooms').value;
                const email = document.getElementById('email').value;
                
                if (!postalCode || !bedrooms || !bathrooms || !email) {
                    alert('Please fill in all required fields to get your quote');
                    return false;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    alert('Please enter a valid email address');
                    return false;
                }
            }
            
            // Step 2 validation
            if (step === 2) {
                // Check if access method is selected
                const accessSelected = document.querySelector('.option-block[data-access].selected');
                if (!accessSelected) {
                    alert('Please select how your cleaner can access the property');
                    return false;
                }
                
                // If concierge, keysafe or hidden is selected, check details are filled
                const accessMethod = accessSelected.dataset.access;
                if (accessMethod === 'concierge' && !document.getElementById('concierge-location').value) {
                    alert('Please specify where the concierge is located');
                    return false;
                }
                
                if (accessMethod === 'keysafe' && (!document.getElementById('keysafe-location').value || !document.getElementById('keysafe-code').value)) {
                    alert('Please specify the key safe location and passcode');
                    return false;
                }
                
                if (accessMethod === 'hidden' && !document.getElementById('hidden-location').value) {
                    alert('Please specify where the key is hidden');
                    return false;
                }
                
                // Check if pets option is selected
                const petsSelected = document.querySelector('.option-block[data-pets].selected');
                if (!petsSelected) {
                    alert('Please select if you have any pets');
                    return false;
                }
                
                // If pets are yes, check at least one type is selected
                if (petsSelected.dataset.pets === 'yes') {
                    const petTypesSelected = document.querySelectorAll('.pet-type-option.selected');
                    if (petTypesSelected.length === 0) {
                        alert('Please select what type of pets you have');
                        return false;
                    }
                }
                
                // Check if a date is selected
                const dateSelected = document.querySelector('#calendar-days .calendar-day.selected');
                if (!dateSelected) {
                    alert('Please select a date for your first clean');
                    return false;
                }
                
                // Check if a time slot is selected
                const timeSelected = document.querySelector('.time-slot.selected');
                if (!timeSelected) {
                    alert('Please select a time slot for your cleaner to arrive');
                    return false;
                }
            }
            
            // Step 3 validation
            if (step === 3) {
                const fullName = document.getElementById('full-name').value;
                const mobile = document.getElementById('mobile').value;
                const address1 = document.getElementById('address1').value;
                const city = document.getElementById('city').value;
                
                if (!fullName || !mobile || !address1 || !city) {
                    alert('Please fill in all required fields');
                    return false;
                }
                
                // Simple mobile validation
                const mobileRegex = /^[0-9]{10,15}$/;
                if (!mobileRegex.test(mobile)) {
                    alert('Please enter a valid mobile number');
                    return false;
                }
            }
            
            // Step 4 validation
            if (step === 4) {
                const termsChecked = document.getElementById('terms').checked;
                
                if (!termsChecked) {
                    alert('Please agree to the terms and conditions');
                    return false;
                }
            }
            
            return true;
        }
        
        function updateSummary() {
            // Get all values
            const bedrooms = document.getElementById('bedrooms').value || '-';
            const bathrooms = document.getElementById('bathrooms').value || '-';
            
            // Get selected extras
            updateSelectedExtras();
            const extrasText = selectedExtras.length > 0 ? 
                selectedExtras.map(e => e.name).join(', ') : 'None';
            const extrasCost = selectedExtras.reduce((sum, extra) => sum + extra.cost, 0);
            
            // Get work hours
            const workHoursOption = document.querySelector('.option-block[data-hours].selected');
            const workHours = workHoursOption ? workHoursOption.dataset.hours + ' hours' : '-';
            
            // Get cleaning products
            const productsOption = document.querySelector('.option-block[data-products].selected');
            const products = productsOption ? 
                (productsOption.dataset.products === 'bring' ? 'We bring' : 'I provide') : '-';
            
            // Get frequency
            const frequencyOption = document.querySelector('.option-block[data-frequency].selected');
            let frequency = '-';
            if (frequencyOption) {
                switch(frequencyOption.dataset.frequency) {
                    case 'more-than-weekly': frequency = 'More than weekly'; break;
                    case 'weekly': frequency = 'Every week'; break;
                    case 'biweekly': frequency = 'Every 2 weeks'; break;
                    case 'one-off': frequency = 'One-off'; break;
                }
            }
            
            // Get selected date
            const dateSelected = document.querySelector('#calendar-days .calendar-day.selected');
            let dateText = '-';
            if (dateSelected) {
                const day = dateSelected.textContent;
                const monthNames = ["January", "February", "March", "April", "May", "June", 
                                  "July", "August", "September", "October", "November", "December"];
                dateText = `${day} ${monthNames[currentMonth]} ${currentYear}`;
            }
            
            // Get selected time
            const timeSelected = document.querySelector('.time-slot.selected');
            const timeText = timeSelected ? timeSelected.dataset.time : '-';
            
            // Calculate total
            let total = 0;
            if (bedrooms !== '-' && bathrooms !== '-') {
                // Base price
                total = 50 + (parseInt(bedrooms) * 15) + (parseInt(bathrooms) * 20);
                
                // Add extras
                total += extrasCost;
                
                // Adjust for frequency
                if (frequencyOption) {
                    switch(frequencyOption.dataset.frequency) {
                        case 'more-than-weekly': total *= 0.9; break; // 10% discount
                        case 'weekly': total *= 0.95; break; // 5% discount
                        case 'biweekly': break; // no discount
                        case 'one-off': total *= 1.1; break; // 10% premium
                    }
                }
            }
            
            // Update dropdown summary
            document.getElementById('dropdown-summary-bedrooms').textContent = bedrooms;
            document.getElementById('dropdown-summary-bathrooms').textContent = bathrooms;
            document.getElementById('dropdown-summary-extras').textContent = extrasText;
            document.getElementById('dropdown-summary-hours').textContent = workHours;
            document.getElementById('dropdown-summary-products').textContent = products;
            document.getElementById('dropdown-summary-frequency').textContent = frequency;
            document.getElementById('dropdown-summary-date').textContent = dateText;
            document.getElementById('dropdown-summary-total').textContent = `£${total.toFixed(2)}`;
            
            // Update total amount in header
            document.getElementById('summary-total-amount').textContent = `£${total.toFixed(2)}`;
        }
        
        // Initialize Stripe
        function initializeStripe() {
            if (typeof Stripe === 'undefined') {
                console.error('Stripe.js not loaded');
                return;
            }
            
            const stripe = Stripe('pk_test_your_test_key_here');
            const elements = stripe.elements();
            
            const style = {
                base: {
                    color: '#32325d',
                    fontFamily: '"Poppins", sans-serif',
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

            const card = elements.create('card', { style: style });
            card.mount('#card-element');

            // Handle real-time validation errors
            card.addEventListener('change', function(event) {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });

            // Handle form submission
            const form = document.getElementById('signup-form');
            form.addEventListener('submit', function(event) {
                event.preventDefault();

                stripe.createPaymentMethod({
                    type: 'card',
                    card: card,
                    billing_details: {
                        name: document.getElementById('full-name').value,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('mobile').value,
                        address: {
                            line1: document.getElementById('address1').value,
                            line2: document.getElementById('address2').value,
                            city: document.getElementById('city').value,
                            postal_code: document.getElementById('postal-code-confirm').value
                        }
                    }
                }).then(function(result) {
                    if (result.error) {
                        // Show error to customer
                        document.getElementById('card-errors').textContent = result.error.message;
                    } else {
                        // Send payment method to your server
                        generateInvoice(result.paymentMethod.id);
                    }
                });
            });
        }
        
        // File upload handling
        let uploadedFiles = [];

        function handleFileUpload(event) {
            const files = Array.from(event.target.files);
            const previewContainer = document.getElementById('file-preview-container');
            
            files.slice(0, 5).forEach(file => {
                if (uploadedFiles.length >= 5) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileType = file.type.split('/')[0];
                    const preview = document.createElement('div');
                    preview.className = 'file-preview';
                    
                    if (fileType === 'image') {
                        preview.innerHTML = `
                            <img src="${e.target.result}" alt="${file.name}">
                            <div class="remove-file" onclick="removeFile('${file.name}')">&times;</div>
                        `;
                    } else if (fileType === 'video') {
                        preview.innerHTML = `
                            <video controls>
                                <source src="${e.target.result}" type="${file.type}">
                            </video>
                            <div class="remove-file" onclick="removeFile('${file.name}')">&times;</div>
                        `;
                    }
                    
                    previewContainer.appendChild(preview);
                    uploadedFiles.push({
                        name: file.name,
                        type: file.type,
                        data: e.target.result
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        function removeFile(fileName) {
            uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
            const previews = Array.from(document.getElementsByClassName('file-preview'));
            previews.forEach(preview => {
                if ((preview.querySelector('img') && preview.querySelector('img').alt === fileName) || 
                    (preview.querySelector('source') && preview.querySelector('source').src.includes(fileName))) {
                    preview.remove();
                }
            });
        }
        
        function generateInvoice(paymentId) {
            // Customer details
            document.getElementById('invoice-name').textContent = document.getElementById('full-name').value;
            document.getElementById('invoice-address').textContent = 
                `${document.getElementById('address1').value}, ${document.getElementById('address2').value || ''}, ${document.getElementById('city').value}, ${document.getElementById('postal-code-confirm').value}`;
            document.getElementById('invoice-phone').textContent = document.getElementById('mobile').value;
            document.getElementById('invoice-email').textContent = document.getElementById('email').value;
            
            // Invoice details
            document.getElementById('invoice-number').textContent = `INV-${paymentId.slice(-8)}`;
            const today = new Date();
            document.getElementById('invoice-date').textContent = today.toLocaleDateString('en-GB');
            
            // Invoice items
            const itemsBody = document.getElementById('invoice-items-body');
            itemsBody.innerHTML = '';
            
            // Base cleaning
            const bedrooms = parseInt(document.getElementById('bedrooms').value) || 0;
            const bathrooms = parseInt(document.getElementById('bathrooms').value) || 0;
            let basePrice = 50 + (bedrooms * 15) + (bathrooms * 20);
            
            addInvoiceItem(itemsBody, 'Standard Cleaning', 1, basePrice);
            
            // Extra tasks
            selectedExtras.forEach(extra => {
                addInvoiceItem(itemsBody, extra.name, 1, extra.cost);
            });
            
            // Frequency adjustment
            const frequencyOption = document.querySelector('.option-block[data-frequency].selected');
            let frequencyText = '';
            let frequencyAdjustment = 0;
            
            if (frequencyOption) {
                const subtotal = basePrice + selectedExtras.reduce((sum, extra) => sum + extra.cost, 0);
                
                switch(frequencyOption.dataset.frequency) {
                    case 'more-than-weekly':
                        frequencyText = 'More than weekly (10% discount)';
                        frequencyAdjustment = -subtotal * 0.1;
                        break;
                    case 'weekly':
                        frequencyText = 'Every week (5% discount)';
                        frequencyAdjustment = -subtotal * 0.05;
                        break;
                    case 'one-off':
                        frequencyText = 'One-off (10% premium)';
                        frequencyAdjustment = subtotal * 0.1;
                        break;
                    default:
                        frequencyText = 'Every 2 weeks';
                }
                
                if (frequencyAdjustment !== 0) {
                    addInvoiceItem(itemsBody, frequencyText, 1, frequencyAdjustment);
                }
            }
            
            // Calculate total
            const total = basePrice + 
                         selectedExtras.reduce((sum, extra) => sum + extra.cost, 0) + 
                         frequencyAdjustment;
            
            document.getElementById('invoice-total-amount').textContent = `£${total.toFixed(2)}`;
            
            // Show invoice and hide form
            document.getElementById('invoice-container').style.display = 'block';
            document.querySelector('.form-container form').style.display = 'none';
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
        
        function printInvoice() {
            window.print();
        }
        
        function downloadInvoice() {
            alert('Invoice download functionality would be implemented here in a production environment');
            // In production, this would generate a PDF or other downloadable format
        }