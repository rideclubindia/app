import React, { useState } from 'react';
import { PageShell, IconList } from '../rideclub/PageShell';
import { Reveal } from '../rideclub/Reveal';
import { contactMethods, socialLinks } from './data';
import { addContactMessage } from '../../../services/apiClient';
import emailjs from '@emailjs/browser';
import { CheckCircle2 } from 'lucide-react';

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
    <PageShell
      eyebrow="Contact"
      title={<>We'd love to <em>hear from you.</em></>}
      intro="Questions about the app, feedback on a feature, or want to bring your club onto RideClub? Send us a message."
      aside={
        <IconList
          items={contactMethods.map((m) => ({
            icon: m.icon,
            title: m.title,
            meta: <a href={m.link}>{m.action} →</a>
          }))}
        />
      }
    >
      <section className="rc-band rc-band-tint">
        <div className="rc-wrap rc-halves rc-split">
          <Reveal>
            <span className="rc-eyebrow">Send a message</span>
            <h2 className="rc-title">Tell us what you need.</h2>
            <p className="rc-lead rc-split-lead">Our rider support team reads every message and replies by email.</p>
            <div className="rc-socials">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return <span key={s.id}><Icon size={16} /> {s.handle}</span>;
              })}
            </div>
          </Reveal>
          <Reveal>
            <form onSubmit={handleSubmit} className="rc-form">
              <div className="rc-form-row">
                <label>Your name
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} autoComplete="name" />
                </label>
                <label>Email address
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} autoComplete="email" />
                </label>
              </div>
              <label>What's it about?
                <select value={inquiryType} onChange={(e) => setInquiryType(e.target.value)} disabled={isSubmitting}>
                  <option value="Customer Support">Help with the app</option>
                  <option value="App Feedback & Suggestions">Feedback or a feature idea</option>
                  <option value="Crash Sentinel Feedback">Crash detection</option>
                  <option value="Business Partnership">Bringing a club or group onboard</option>
                  <option value="Other Inquiry">Something else</option>
                </select>
              </label>
              <label>Subject (optional)
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isSubmitting} />
              </label>
              <label>Message
                <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required disabled={isSubmitting} />
              </label>
              <button type="submit" disabled={isSubmitting} className="rc-btn rc-btn-primary">
                <span>{isSubmitting ? 'Sending…' : 'Send message'}</span>
              </button>
              {successMessage && <div className="rc-form-msg is-ok" role="status"><CheckCircle2 size={16} /> {successMessage}</div>}
              {errorMessage && <div className="rc-form-msg is-err" role="alert">{errorMessage}</div>}
            </form>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
};

export default Contact;
