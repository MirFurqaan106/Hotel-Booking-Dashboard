import React, { useState } from 'react';
import { FiPlus, FiMinus, FiHelpCircle } from 'react-icons/fi';
import './FAQ.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: "Where is Panun Ghar Luxury Resort located?",
      a: "Our heritage-inspired sanctuary is nestled near the scenic Dal Lake slopes in Srinagar, Kashmir. We offer free valet parking and prefilled travel transport coordinate routing logs."
    },
    {
      q: "How do I verify my guest user account?",
      a: "Upon completing registration signup, a 6-digit One-Time Password (OTP) verification code is dispatched to your email address. Type the code in the modal box to activate. (Note: Check Python backend console log drafts if mail server triggers mock SMTP username errors)."
    },
    {
      q: "What payment options are accepted?",
      a: "We accept three modes of transaction checkout: Pay Later during check-in ($0 downpayment), Token advance ($100 payment verify upfront via simulated Razorpay API checks), or Full payment captures."
    },
    {
      q: "Can I cancel my stay online?",
      a: "Yes! Registered guest customers can cancel their upcoming stays directly from their personal 'My Dashboard' portal page. Cancellations dispatch email notifications and alert administrators."
    },
    {
      q: "Are the Heated Pool and Private Cinema Lounge free?",
      a: "Absolutely. All verified guest bookings include complimentary valet check-ins, traditional Kashmiri Kahwa tea on arrival, heated swimming pool accessibility, and booking tickets for our private cinema theater lounges."
    },
    {
      q: "Can I register as a Manager or Admin directly?",
      a: "No. Self-registration for Manager and Admin accounts is blocked for safety. Administrators can add managers directly from their secure administrative settings portal screen."
    }
  ];

  const handleToggle = (index) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="faq-page-container page-container animate-fade-in">
      <div className="faq-header-box">
        <FiHelpCircle size={40} className="text-primary" />
        <h2>Frequently Asked Questions</h2>
        <p>Find answers to common questions about reservations, check-ins, and guest details at Panun Ghar.</p>
      </div>

      <div className="faq-list-accordion">
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div key={index} className={`faq-item card glass-panel ${isOpen ? 'open' : ''}`}>
              <button className="faq-question-btn" onClick={() => handleToggle(index)}>
                <span>{faq.q}</span>
                <span className="faq-toggle-icon">
                  {isOpen ? <FiMinus size={18} /> : <FiPlus size={18} />}
                </span>
              </button>
              
              <div className="faq-answer-collapse">
                <p>{faq.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQ;
export { FAQ };
