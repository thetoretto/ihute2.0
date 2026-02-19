import { useState } from 'react';
import { IconHelp } from './Icons';

const faqRows = [
  {
    q: 'How do I book a ride?',
    a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed scelerisque egestas nibh.',
  },
  {
    q: 'How can I contact my driver?',
    a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed scelerisque egestas nibh.',
  },
  {
    q: 'How does payment work?',
    a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Bibendum vel enim sed quam in arcu nunc sed mattis.',
  },
  {
    q: 'What if my ride is canceled?',
    a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Velit amet scelerisque volutpat hac mauris.',
  },
];

export default function HelpCenter() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="lp-section help-section" id="help-centre">
      <div className="lp-container">
        <div className="lp-heading-block">
          <IconHelp className="section-icon" aria-hidden style={{ marginBottom: 8 }} />
          <h2 className="lp-title">Carpool Help Centre</h2>
          <p className="lp-subtitle">Find answers to common questions about booking and rides.</p>
        </div>

        <div className="faq-panel">
          {faqRows.map((faq, index) => {
            const open = openIndex === index;
            return (
              <article className={`faq-row${open ? ' open' : ''}`} key={faq.q}>
                <button type="button" onClick={() => setOpenIndex(open ? null : index)}>
                  <span>{faq.q}</span>
                  <span>{open ? '−' : '+'}</span>
                </button>
                {open && <p>{faq.a}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
