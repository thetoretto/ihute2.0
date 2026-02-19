import { IconCalendar, IconTag, IconShield } from './Icons';

const benefits = [
  {
    Icon: IconCalendar,
    title: 'Where and when you want',
    desc: 'Search bus and carpool options across East Africa. Choose your departure, destination and date — we help you find the right ride.',
  },
  {
    Icon: IconTag,
    title: 'Your favorite trips at low prices',
    desc: 'Whether you go by bus or carpool, find the trip that fits your budget among our routes and trusted drivers.',
  },
  {
    Icon: IconShield,
    title: 'Travel with confidence',
    desc: 'We verify driver profiles and partner operators. Book on a secure platform and know who you are travelling with.',
  },
];

export default function Benefits() {
  return (
    <section className="lp-section benefits-bbc" id="benefits">
      <div className="lp-container">
        <div className="benefits-bbc-grid">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="benefits-bbc-card">
              <benefit.Icon className="benefits-bbc-icon" aria-hidden />
              <h3 className="benefits-bbc-card-title">{benefit.title}</h3>
              <p className="benefits-bbc-card-desc">{benefit.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
