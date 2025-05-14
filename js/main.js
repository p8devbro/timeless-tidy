(function ($) {
    "use strict";
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 200) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });
    
    
    // Dropdown on mouse hover
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function () {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function () {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
    });

    //new faqs
    const faqItems = document.querySelectorAll('.faq-itemnew');

faqItems.forEach(item => {
  const button = item.querySelector('.faq-questionnew');
  button.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    faqItems.forEach(i => i.classList.remove('active'));
    if (!isActive) item.classList.add('active');
  });
});




    // Testimonials carousel
    $(".testimonials-carousel").owlCarousel({
        autoplay: true,
        dots: true,
        loop: true,
        responsive: {
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:3
            }
        }
    });
    
    
    // Portfolio isotope and filter
    var portfolioIsotope = $('.portfolio-container').isotope({
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
    });

    $('#portfolio-flters li').on('click', function () {
        $("#portfolio-flters li").removeClass('filter-active');
        $(this).addClass('filter-active');

        portfolioIsotope.isotope({filter: $(this).data('filter')});
    });
    
})(jQuery);

//new functions for quote, user and the rest
// Auth functions
async function login() {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    });
    // Handle response
  }
  
  async function signup() {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value
      })
    });
    // Handle response
  }
  
  // Payment handling
  async function handlePayment() {
    const paymentData = {
      cardNumber: document.getElementById('card-number').value,
      // Collect other payment details
    };
    
    const response = await fetch('/api/client/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    if (response.ok) {
      // Send email with login details
      sendLoginEmail();
      showDashboard();
    }
  }
  
  function sendLoginEmail() {
    const mailOptions = {
      from: 'your_service@email.com',
      to: document.getElementById('email').value,
      subject: 'Your Cleaning Service Account',
      html: `<p>Your login details:<br>
             Email: ${document.getElementById('email').value}<br>
             Password: [generated password]</p>`
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error(error);
    });
  }