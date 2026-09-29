import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import WebsitePage from './WebsitePage';
import { PRIVACY_POLICY_TEXT as fallbackPrivacyText, TERMS_TEXT as fallbackTermsText } from '../content/legalPolicies';

// Fallback texts


interface WebsitePolicyPageProps {
  type: 'privacy' | 'terms';
}

const WebsitePolicyPage: React.FC<WebsitePolicyPageProps> = ({ type }) => {
  const [content, setContent] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data } = await supabase
          .from('cms_policies')
          .select('*')
          .eq('type', type)
          .eq('is_published', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();
          
        if (data && data.content) {
          setContent(data.content);
          setLastUpdated(new Date(data.updated_at).toLocaleDateString());
        } else {
          setContent(type === 'privacy' ? fallbackPrivacyText : fallbackTermsText);
          setLastUpdated(new Date().toLocaleDateString());
        }
      } catch (err) {
        setContent(type === 'privacy' ? fallbackPrivacyText : fallbackTermsText);
        setLastUpdated(new Date().toLocaleDateString());
      }
      setLoading(false);
    };
    
    fetchPolicy();
  }, [type]);

  const renderFormattedContent = (text: string) => {
    // Strip the redundant headers from the top if they exist
    let cleanText = text;
    cleanText = cleanText.replace(/RIDE CLUB PRIVACY POLICY/i, '');
    cleanText = cleanText.replace(/RIDE CLUB TERMS OF SERVICE/i, '');
    cleanText = cleanText.replace(/Last Updated:.*?(\n|$)/i, '');
    cleanText = cleanText.trim();

    return cleanText.split('\n\n').map((block, idx) => {
      if (!block.trim()) return null;
      
      const lines = block.split('\n');
      const isHeader = lines[0].match(/^\d+\.\s/);
      
      if (isHeader) {
        return (
          <div key={idx} style={{ marginBottom: '40px' }}>
            <h3 className="text-xl font-bold mb-4 pb-3 border-b border-zinc-800 tracking-tight">
              {lines[0]}
            </h3>
            <div className="text-zinc-400 text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {lines.slice(1).join('\n')}
            </div>
          </div>
        );
      }

      return (
        <div key={idx} className="mb-6 text-zinc-400 text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
          {block}
        </div>
      );
    });
  };

  return (
    <WebsitePage title={title}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#888' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--orange)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          Loading {title}...
        </div>
      ) : (
        <div style={{ fontFamily: 'Inter, sans-serif', padding: '20px 0' }}>
          {renderFormattedContent(content)}
        </div>
      )}
    </WebsitePage>
  );
};

export default WebsitePolicyPage;
