import React, { useState } from 'react';
import { FiMail, FiPhone, FiCompass, FiSend, FiCheckCircle } from 'react-icons/fi';
import './Support.css';

const Support = () => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const sendEmailAlert = () => {
    const subject = encodeURIComponent(`[Panun Ghar Support] Ticket: ${ticketSubject}`);
    const body = encodeURIComponent(`Message detail:\n\n${ticketMessage}\n\nClient Contact Support`);
    window.location.href = `mailto:mirfurkaan106@gmail.com?subject=${subject}&body=${body}`;
  };

  const sendWhatsAppAlert = () => {
    const msg = encodeURIComponent(`*Panun Ghar Support Ticket*\n*Subject*: ${ticketSubject}\n*Message*: ${ticketMessage}`);
    window.open(`https://wa.me/917889984798?text=${msg}`, '_blank');
  };

  return (
    <div className="support-page-container page-container animate-fade-in">
      <div className="support-header-box">
        <FiCompass size={40} className="text-primary" />
        <h2>Guest Support Center</h2>
        <p>Do you have inquiries or custom stay requirements? Contact us directly or log a support ticket.</p>
      </div>

      <div className="support-split-layout">
        {/* Contact Info Cards */}
        <div className="support-info-cards">
          <div className="info-card card glass-panel">
            <div className="info-icon text-primary">
              <FiPhone size={24} />
            </div>
            <h3>Direct Hotline</h3>
            <p className="highlight-text">+91 7889984798</p>
            <p className="sub-text">Speak with resort desk managers directly (24/7 support).</p>
          </div>

          <div className="info-card card glass-panel">
            <div className="info-icon text-success">
              <FiMail size={24} />
            </div>
            <h3>Email Support</h3>
            <p className="highlight-text">mirfurkaan106@gmail.com</p>
            <p className="sub-text">For customized heritage reservation quotes and queries.</p>
          </div>
        </div>

        {/* Support ticket logger */}
        <div className="support-ticket-card card glass-panel">
          <h3>Log a Support Ticket</h3>
          
          {submitted ? (
            <div className="ticket-success-view">
              <FiCheckCircle size={48} className="text-success" />
              <h4>Ticket Logged Successfully!</h4>
              <p>Alert manager <strong>Mir Furqaan</strong> to review your query details:</p>
              
              <div className="ticket-actions">
                <button className="notify-btn gmail-btn" onClick={sendEmailAlert}>
                  <FiMail size={16} />
                  <span>Alert via Gmail Mailto</span>
                </button>
                <button className="notify-btn whatsapp-btn" onClick={sendWhatsAppAlert}>
                  <FiSend size={16} />
                  <span>Alert via WhatsApp API</span>
                </button>
              </div>

              <button className="reset-ticket-btn" onClick={() => { setSubmitted(false); setTicketSubject(''); setTicketMessage(''); }}>
                Submit Another Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="support-ticket-form">
              <div className="grp">
                <label>Subject Inquiries</label>
                <input 
                  type="text" 
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Room upgrade inquiry"
                  required
                />
              </div>

              <div className="grp">
                <label>Message details</label>
                <textarea 
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Explain your stay query particulars..."
                  rows={5}
                  required
                ></textarea>
              </div>

              <button type="submit" className="confirm-booking-btn">
                Log Support Ticket
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
export { Support };
