import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { contactMethods, socialLinks } from './data';
import '../../Website.css';
import { addContactMessage } from '../../../services/apiClient';
import emailjs from '@emailjs/browser';
import { CheckCircle2 } from 'lucide-react';
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
      {/* WEBFLOW DEVELOPER SUBPAGE HERO */}
      <section className="dev-subpage-hero">
        <div className="dev-subpage-badge">
          <span>RIDER SUPPORT & COMMUNICATIONS</span>
        </div>
        <h1 className="dev-subpage-title">
          We'd Love To <br />
          <span className="gradient-accent">Hear From You</span>
        </h1>
        <p className="dev-subpage-subtitle">
          Have feedback on the cockpit HUD, need route planning assistance, or want to register a new riding chapter? Our team is on standby to assist.
        </p>
      </section>

      {/* SPLIT CONTACT SECTION (Webflow Developer Layout) */}
      <section className="dev-section pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Contact Channels */}
          <div className="lg:col-span-5 space-y-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.id} className="dev-feature-panel">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{method.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{method.description}</p>
                  <a
                    href={method.link}
                    className="text-xs font-mono font-bold text-orange-500 hover:text-white transition-colors"
                  >
                    {method.action} &rarr;
                  </a>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Contact Form */}
          <div className="lg:col-span-7 dev-feature-panel">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Send a Dispatch</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Our rider support engineers review all incoming messages within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">YOUR NAME</label>
                  <input
                    type="text"
                    placeholder="Harsha S."
                    className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="rider@rideclub.in"
                    className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">DISPATCH CATEGORY</label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="Customer Support">Rider Support & App Issues</option>
                  <option value="App Feedback & Suggestions">Cockpit HUD Suggestions</option>
                  <option value="Crash Sentinel Feedback">Crash Sentinel Telemetrics</option>
                  <option value="Business Partnership">Motorcycle Club & Chapter Onboarding</option>
                  <option value="Other Inquiry">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">SUBJECT (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="Subject of your message..."
                  className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">DETAILED MESSAGE</label>
                <textarea
                  rows={5}
                  placeholder="How can we assist your riding journey?"
                  className="w-full px-3.5 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500 font-sans text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="dev-btn-primary w-full justify-center py-3 text-sm"
              >
                <span>{isSubmitting ? 'Transmitting...' : 'Send Message'}</span>
              </button>

              {successMessage && (
                <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} /> {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </WebsitePage>
  );
};

export default Contact;
