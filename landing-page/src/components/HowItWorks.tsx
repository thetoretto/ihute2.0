import { IconCalendar, IconMessage, IconCheck, IconSearch, IconRoute } from './Icons';

const steps = [
  { title: 'Fill your detail', text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.', Icon: IconCalendar },
  { title: 'Talk to the drive', text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.', Icon: IconMessage },
  { title: 'Confirm your seat', text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.', Icon: IconCheck },
  { title: 'Search for the perfect ride', text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.', Icon: IconSearch },
  { title: 'Select the route', text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.', Icon: IconRoute },
];

export default function HowItWorks() {
  return (
    <section className="lp-section how-section" id="how-it-works">
      <div className="lp-container">
        <div className="lp-heading-block">
          <h2 className="lp-title">How does it work</h2>
          <p className="lp-subtitle">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.
          </p>
        </div>

        <div className="how-stage">
          <div className="how-center-visual" aria-hidden="true">
            <div className="how-road" />
            <div className="how-road-stop start" />
            <div className="how-road-stop end" />
            <div className="how-car" />
          </div>

          {steps.map((step, index) => (
            <article key={step.title} className={`how-float-card card-${index + 1}`}>
              <step.Icon className="card-icon" aria-hidden />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
