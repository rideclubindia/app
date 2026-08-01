import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  dark?: boolean;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, dark = true }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const textColor = dark ? '#fff' : '#111';
  const mutedColor = dark ? '#a1a1aa' : '#555';
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '28px 4px',
                textAlign: 'left',
                color: textColor,
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              <span>{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isOpen ? 'var(--orange)' : 'rgba(239, 69, 35, 0.1)',
                  color: isOpen ? '#fff' : 'var(--orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={16} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{ margin: '0 0 28px 0', fontSize: '15px', lineHeight: 1.7, color: mutedColor, maxWidth: '620px' }}>
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
