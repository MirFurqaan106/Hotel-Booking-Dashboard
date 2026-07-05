import React, { useState } from 'react';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCheckCircle, 
  FiSend, 
  FiMessageSquare,
  FiX
} from 'react-icons/fi';
import './ContactUs.css';

const ContactUs = () => {
  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submittedQuery, setSubmittedQuery] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Save query details
    setSubmittedQuery(form);
    setShowModal(true);
    setToast("Query registered! Preparing notifications...");
    setTimeout(() => setToast(''), 3000);
  };

  // Gmail mailto trigger
  const sendEmailQuery = () => {
    if (!submittedQuery) return;
    const subjectLine = encodeURIComponent(`[Panun Ghar Support] Guest Query: ${submittedQuery.subject}`);
    const bodyText = encodeURIComponent(
      `Hello Mir Furqaan,\n\n` +
      `You have received a new support query through the website:\n\n` +
      `- From: ${submittedQuery.name}\n` +
      `- Email: ${submittedQuery.email}\n` +
      `- Contact Phone: ${submittedQuery.phone}\n` +
      `- Subject: ${submittedQuery.subject}\n` +
      `- Query Message:\n"${submittedQuery.message}"\n\n` +
      `Best regards,\n` +
      `Support Form Mailer`
    );
    window.location.href = `mailto:mirfurkaan106@gmail.com?subject=${subjectLine}&body=${bodyText}`;
  };

  // WhatsApp wa.me trigger
  const sendWhatsAppQuery = () => {
    if (!submittedQuery) return;
    const messageText = encodeURIComponent(
      `*Panun Ghar Guest Query*\n\n` +
      `• *Name*: ${submittedQuery.name}\n` +
      `• *Email*: ${submittedQuery.email}\n` +
      `• *Phone*: ${submittedQuery.phone}\n` +
      `• *Subject*: ${submittedQuery.subject}\n` +
      `• *Message*: "${submittedQuery.message}"`
    );
    window.open(`https://wa.me/917889984798?text=${messageText}`, '_blank');
  };

  const handleClose = () => {
    setShowModal(false);
    setSubmittedQuery(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-page page-container animate-fade-in">
      <div className="contact-header-block">
        <h1>Contact Us</h1>
        <p>Have a question about room capacity, cinema availability, or how to get here? Message us directly.</p>
      </div>

      {toast && (
        <div className="toast-notification animate-fade-in">
          <FiCheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="contact-split-grid">
        {/* Left Side: Contact details card */}
        <div className="contact-info-panel card">
          <h3>Get In Touch</h3>
          <p>We are available to answer your reservation queries and assist with your travel planning to Srinagar.</p>

          <div className="info-items-list">
            <div className="info-item-block">
              <div className="icon-circ bg-primary-light text-primary">
                <FiPhone size={18} />
              </div>
              <div className="meta">
                <span>Call Directly</span>
                <strong>+91 78899 84798</strong>
              </div>
            </div>

            <div className="info-item-block">
              <div className="icon-circ bg-success-light text-success">
                <FiMail size={18} />
              </div>
              <div className="meta">
                <span>Email Address</span>
                <strong>mirfurkaan106@gmail.com</strong>
              </div>
            </div>

            <div className="info-item-block">
              <div className="icon-circ bg-info-light text-info">
                <FiMapPin size={18} />
              </div>
              <div className="meta">
                <span>Hotel Location</span>
                <strong>Near Dal Lake, Srinagar, Kashmir - 190001</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form card */}
        <div className="contact-form-panel card glass-panel">
          <h3>Submit a Support Query</h3>
          
          <form onSubmit={handleFormSubmit} className="contact-query-form">
            <div className="form-row">
              <div className="group">
                <label>Your Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Mudassir Ahmad"
                  required
                />
              </div>
              <div className="group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="e.g. mudassir@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="group">
                <label>Contact Phone</label>
                <input 
                  type="text" 
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +91 94190 12345"
                  required
                />
              </div>
              <div className="group">
                <label>Query Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={form.subject}
                  onChange={handleInputChange}
                  placeholder="e.g. Booking availability / Sightseeing"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label>Message Content</label>
              <textarea 
                name="message"
                value={form.message}
                onChange={handleInputChange}
                placeholder="Write your query details here..."
                rows={5}
                required
              ></textarea>
            </div>

            <button type="submit" className="query-submit-btn">
              <FiSend size={14} />
              <span>Submit Query</span>
            </button>
          </form>
        </div>
      </div>

      {/* Query notification Modal overlay */}
      {showModal && submittedQuery && (
        <div className="modal-backdrop">
          <div className="success-modal card glass-panel animate-fade-in">
            <div className="success-icon-header">
              <FiCheckCircle size={54} className="text-success" />
              <h2>Query Registered!</h2>
              <p className="booking-ref-txt">Thank you, <strong>{submittedQuery.name}</strong></p>
            </div>

            <div className="success-details-box">
              <p>Subject: <strong>{submittedQuery.subject}</strong></p>
              <p>Message: <em>"{submittedQuery.message}"</em></p>
            </div>

            <div className="notification-actions-box">
              <p className="act-txt">Launch the notifications to alert manager <strong>Mir Furqaan</strong>:</p>
              
              <div className="actions-vertical-grid">
                <button className="notify-btn gmail-btn" onClick={sendEmailQuery}>
                  <FiMail size={16} />
                  <span>Send Notification via Gmail</span>
                </button>
                
                <button className="notify-btn whatsapp-btn" onClick={sendWhatsAppQuery}>
                  <FiMessageSquare size={16} />
                  <span>Send Notification via WhatsApp</span>
                </button>
              </div>
            </div>

            <button className="close-success-modal-btn" onClick={handleClose}>
              Close & Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
export { ContactUs };
