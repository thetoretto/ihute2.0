import { IconRoute } from './Icons';

const topRoutes = [
  'Bangalore > Chennai',
  'Delhi > Chandigarh',
  'Gurgaon > Agra',
  'Pune > Mumbai',
  'Kanpur > Lucknow',
];

export default function TopRoutes() {
  return (
    <section className="lp-section routes-section" id="top-routes">
      <div className="lp-container">
        <div className="lp-heading-block">
          <IconRoute className="section-icon" aria-hidden />
          <h2 className="lp-title">Top Carpool route</h2>
          <p className="lp-subtitle">Popular routes with frequent rides.</p>
        </div>

        <ul className="route-list-clean">
          {topRoutes.map((route) => (
            <li key={route}>
              <button type="button">{route}</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
