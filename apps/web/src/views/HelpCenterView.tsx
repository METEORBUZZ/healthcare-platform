import React from 'react';
import {
  HelpCircle,
  PhoneCall,
  FileQuestion,
  ShieldCheck,
  LifeBuoy,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export const HelpCenterView: React.FC = () => {
  return (
    <div className="help-center-view" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#003b73',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HelpCircle size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Hospital Help & Support Center
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, marginTop: '0.2rem' }}>
            Emergency contacts, clinical system documentation, and IT help desk.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border, #e2e8f0)',
            padding: '1.5rem',
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <PhoneCall size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem', color: '#0f172a' }}>
            Emergency Trauma Hotline
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '1rem' }}>
            Direct connection to Chief Medical Officer & Emergency ICU Ward.
          </p>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>
            +91 108 / +91 (079) 4900 8911
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border, #e2e8f0)',
            padding: '1.5rem',
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <LifeBuoy size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem', color: '#0f172a' }}>
            Hospital IT Help Desk
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '1rem' }}>
            Technical assistance for EHR, workstation logins, and blockchain verification.
          </p>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0284c7' }}>
            it-support@niramaya.hospital (Ext. 404)
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border, #e2e8f0)',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#003b73' }}>
          Frequently Asked Questions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
              How do I verify a medical report's blockchain signature?
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem' }}>
              Navigate to "Blockchain ledger" in the sidebar or click "Verify" on any diagnostic report in the Patient Reports portal.
            </div>
          </div>
          <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
              How do I change my profile photo or credentials?
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem' }}>
              Click on your profile card at the top of the sidebar to access the Profile section, then click "Edit Profile" or "Security".
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
