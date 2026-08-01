import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { contactMethods, socialLinks } from './data';
import '../../Website.css';
import { addContactMessage } from '../../../services/apiClient';
import emailjs from '@emailjs/browser';
import { fadeInUp, slideInLeft, slideInRight, staggerContainer, viewport, magneticHover } from '../animations';
import { GradientMesh } from '../GradientArt';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('Customer Support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // 1. Save to database
      await addContactMessage({
        full_name: name,
        email,
        inquiry_type: inquiryType,
        message
      });

      // 2. Send email via EmailJS
      try {
        await emailjs.send(
          'service_cck6ech',
          'template_f4prlaa',
          {
            name,
            email,
            inquiry_type: inquiryType,
            subject: subject || inquiryType,
            message
          },
          'mrvBP3SZGrUGo31cQ'
        );
      } catch (emailErr) {
        console.error('Email sending failed, but message was saved:', emailErr);
      }

      setSuccessMessage('Message sent successfully! We will get back to you soon.');
      setName('');
      setEmail('');
      setInquiryType('Customer Support');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Failed to submit message:', err);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WebsitePage title="Contact" subtitle="Customer Support & Inquiries" fullWidth={true}>
      
      {/* SUBPAGE HERO */}
      <section className="subpage-hero">
        <GradientMesh palette="ember" />
        <div className="overlay"></div>
        <motion.div
          className="subpage-hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="hero-tag" style={{ fontSize: '12px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 800, marginBottom: '20px' }}>Get in Touch</motion.div>
          <motion.h1 variants={fadeInUp} style={{ fontSize: '56px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>We'd Love To <br/><span style={{ color: 'var(--orange)' }}>Hear From You</span></motion.h1>
        </motion.div>
      </section>

      {/* SPLIT LAYOUT */}
      <section className="contact-split">

        {/* LEFT PANE - Dark */}
        <div className="contact-left">
          <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={slideInLeft} style={{ maxWidth: '400px', marginLeft: 'auto' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 60px 0', lineHeight: 1.2 }}>Reach Out</h2>

            <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {contactMethods.map(method => {
                const Icon = method.icon;
                return (
                  <motion.div key={method.id} variants={fadeInUp} style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 69, 35, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color="var(--orange)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{method.title}</h3>
                      <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '12px' }}>{method.description}</p>
                      <a href={method.link} style={{ fontSize: '14px', color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}>{method.action} →</a>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* RIGHT PANE - Light Form */}
        <motion.div className="contact-right" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInRight}>
          <div style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#111', marginBottom: '16px', letterSpacing: '-0.5px' }}>Send us a message</h2>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '40px', lineHeight: 1.6 }}>Fill out the form below and our team will get back to you within 24 hours.</p>

            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Full Name" 
                className="contact-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                disabled={isSubmitting}
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="contact-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isSubmitting}
              />
              <select 
                className="contact-input" 
                required 
                style={{ appearance: 'none', color: '#555' }}
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="" disabled hidden>What do you need help with?</option>
                <option value="Customer Support">Customer Support</option>
                <option value="App Support / Issues">App Support / Issues</option>
                <option value="App Feedback & Suggestions">App Feedback & Suggestions</option>
                <option value="Website Support">Website Support</option>
                <option value="Business Partnership">Business Partnership</option>
                <option value="Other Inquiry">Other Inquiry</option>
              </select>
              <input 
                type="text" 
                placeholder="Subject (Optional)" 
                className="contact-input" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSubmitting}
              />
              <textarea 
                placeholder="Your Message" 
                className="contact-input" 
                rows={4} 
                required 
                style={{ resize: 'none' }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
              
              {successMessage && (
                <div style={{ padding: '12px', background: '#e5f9ed', color: '#34c759', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div style={{ padding: '12px', background: '#ffebee', color: '#ff3b30', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
                  {errorMessage}
                </div>
              )}

              <motion.button
                whileHover={isSubmitting ? {} : magneticHover.whileHover}
                whileTap={isSubmitting ? {} : magneticHover.whileTap}
                type="submit"
                className="btn-orange"
                style={{ padding: '16px 40px', fontSize: '16px', marginTop: '20px', width: '100%', opacity: isSubmitting ? 0.7 : 1 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </motion.button>
            </form>

            <div style={{ marginTop: '80px', display: 'flex', gap: '24px' }}>
              {socialLinks.map(link => {
                const Icon = link.icon;
                return (
                  <a key={link.id} href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                    <Icon size={18} />
                    {link.handle}
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>

      </section>

    </WebsitePage>
  );
};

export default Contact;
