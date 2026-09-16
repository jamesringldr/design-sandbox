// Generic lo-fi shots. Same set for every project; only tokens change them.
import "./lofi.css";

function StatusBar() {
  return (
    <div className="lf-status" aria-hidden="true">
      <span>9:41</span>
      <span className="lf-island" />
      <span className="lf-status-icons">
        <i />
        <i />
      </span>
    </div>
  );
}

function TabBar({ active = 0 }) {
  const tabs = ["Home", "Explore", null, "Saved", "Profile"];
  return (
    <nav className="lf-tabbar" aria-hidden="true">
      {tabs.map((label, index) =>
        label ? (
          <span key={label} className={`lf-tab${index === active ? " on" : ""}`}>
            <i />
            {label}
          </span>
        ) : (
          <span key="add" className="lf-tab-add">
            +
          </span>
        )
      )}
    </nav>
  );
}

function TopBar({ title, action, back = true, trailing = false }) {
  return (
    <header className="lf-topbar">
      {back ? <span className="lf-back">‹</span> : null}
      {title ? <span className="lf-topbar-title">{title}</span> : null}
      <span className="lf-spacer" />
      {action ? <span className="lf-link">{action}</span> : null}
      {trailing ? <span className="lf-icon-box" /> : null}
    </header>
  );
}

function Search({ placeholder = "Search" }) {
  return (
    <div className="lf-row lf-gap-8">
      <div className="lf-search">
        <i />
        {placeholder}
      </div>
      <span className="lf-icon-box" />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="lf-section">
      <h3 className="lf-h">{title}</h3>
      {children}
    </section>
  );
}

function Home() {
  return (
    <>
      <div className="lf-body">
        <h1 className="lf-display">Welcome back</h1>
        <Search />
        <Section title="Featured">
          <div className="lf-grid-3">
            {["Northwind", "Atlas", "Meridian"].map((name) => (
              <div key={name} className="lf-tile lf-tile-tall">
                <span className="lf-tile-label">{name}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Popular now">
          <div className="lf-grid-3">
            <div className="lf-tile" />
            <div className="lf-tile" />
          </div>
        </Section>
        <Section title="Upcoming">
          <div className="lf-banner">
            <span className="lf-tile-label">Spring session</span>
          </div>
        </Section>
      </div>
      <TabBar active={0} />
    </>
  );
}

function SearchScreen() {
  return (
    <>
      <div className="lf-body">
        <div className="lf-row lf-gap-8">
          <span className="lf-back">‹</span>
          <div className="lf-search">
            <i />
            Search
          </div>
          <span className="lf-icon-box" />
        </div>
        <Section title="Categories">
          <div className="lf-grid-3">
            {["Outdoor", "Studio", "Travel", "Home", "Tools", "Kids"].map(
              (name) => (
                <div key={name} className="lf-tile">
                  <span className="lf-tile-label">{name}</span>
                </div>
              )
            )}
          </div>
        </Section>
        <Section title="Trending searches">
          <div className="lf-chips">
            {["Weekend", "New arrivals", "Under 50", "Nearby", "Top rated", "Gifts"].map(
              (chip) => (
                <span key={chip} className="lf-chip">
                  {chip}
                </span>
              )
            )}
          </div>
        </Section>
        <Section title="Recently viewed">
          <div className="lf-grid-3">
            <div className="lf-tile" />
            <div className="lf-tile" />
            <div className="lf-tile" />
          </div>
        </Section>
      </div>
      <TabBar active={1} />
    </>
  );
}

function Filters({ applied }) {
  const options = ["Popular", "Newest", "Closest", "Highest rated"];
  const sizes = ["XS", "S", "M", "L", "XL"];
  return (
    <>
      <TopBar title="Filters" action="Clear" />
      <div className="lf-body">
        <div className="lf-field-group">
          <span className="lf-label">Sort by</span>
          <span className={`lf-select${applied ? " on" : ""}`}>
            {applied ? "Newest" : "Relevance"} <b>›</b>
          </span>
        </div>
        <div className="lf-input">Name contains</div>
        <Section title="Type">
          <ul className="lf-radios">
            {options.map((option, index) => (
              <li
                key={option}
                className={applied && index === 1 ? "on" : ""}
              >
                <i />
                {option}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Price">
          <div className="lf-slider">
            <span
              className="lf-slider-fill"
              style={{ right: applied ? "38%" : "4%" }}
            />
            <span
              className="lf-slider-knob"
              style={{ left: applied ? "62%" : "96%" }}
            />
          </div>
          <span className="lf-caption">
            {applied ? "$0 – $120" : "$0 – $500"}
          </span>
        </Section>
        <Section title="Size">
          <div className="lf-row lf-gap-8">
            {sizes.map((size) => (
              <span
                key={size}
                className={`lf-seg${applied && size === "M" ? " on" : ""}`}
              >
                {size}
              </span>
            ))}
          </div>
        </Section>
        <span className="lf-spacer" />
        <div className={applied ? "lf-btn" : "lf-btn lf-btn-off"}>
          {applied ? "Show 24 results" : "Show results"}
        </div>
      </div>
    </>
  );
}

function Detail() {
  return (
    <>
      <TopBar trailing />
      <div className="lf-body">
        <div className="lf-hero" />
        <h2 className="lf-title">Item title</h2>
        <span className="lf-caption">Maker name</span>
        <p className="lf-copy">A short description of the item goes here.</p>
        <span className="lf-label">Size</span>
        <div className="lf-row lf-gap-8">
          {["XS", "S", "M", "L", "XL"].map((size) => (
            <span key={size} className={`lf-seg${size === "M" ? " on" : ""}`}>
              {size}
            </span>
          ))}
        </div>
        <span className="lf-spacer" />
        <span className="lf-price">$30.00</span>
        <div className="lf-row lf-gap-8">
          <Stepper />
          <div className="lf-btn lf-grow">Add to list</div>
        </div>
      </div>
      <TabBar active={1} />
      <div className="lf-scrim" />
      <div className="lf-dialog" role="dialog">
        <strong>Added</strong>
        <span className="lf-caption">The item is now on your list.</span>
        <div className="lf-dialog-actions">
          <span>Keep browsing</span>
          <span className="lf-link">View list</span>
        </div>
      </div>
    </>
  );
}

function Stepper() {
  return (
    <span className="lf-stepper">
      <b>−</b>1<b>+</b>
    </span>
  );
}

function RowLink({ title, sub }) {
  return (
    <div className="lf-rowlink">
      <div className="lf-stack">
        <strong>{title}</strong>
        <span className="lf-caption">{sub}</span>
      </div>
      <span className="lf-chev">›</span>
    </div>
  );
}

function Summary() {
  return (
    <>
      <TopBar title="Your list" />
      <div className="lf-body">
        <span className="lf-caption">1 item in your list</span>
        <div className="lf-item">
          <div className="lf-thumb" />
          <div className="lf-stack lf-grow">
            <strong>Item title</strong>
            <span className="lf-caption">Size: M</span>
            <span className="lf-caption">$30.00</span>
            <div className="lf-row lf-gap-8">
              <Stepper />
              <span className="lf-spacer" />
              <span className="lf-icon-box lf-icon-danger" />
            </div>
          </div>
        </div>
        <RowLink title="Payment method" sub="Choose a payment method" />
        <RowLink title="Delivery address" sub="221 Harbor St, Portland" />
        <span className="lf-spacer" />
        <div className="lf-row lf-total">
          <strong>Total</strong>
          <span className="lf-spacer" />
          <strong>$30.00</strong>
        </div>
        <div className="lf-btn">Check out</div>
      </div>
    </>
  );
}

function Choice({ chosen }) {
  const options = [
    { title: "Credit card", sub: "•••• 4602" },
    { title: "Debit card", sub: "•••• 1473" },
    { title: "Cash", sub: "" },
  ];
  return (
    <>
      <TopBar title="Payment method" />
      <div className="lf-body">
        {options.map((option, index) => (
          <div
            key={option.title}
            className={`lf-option${chosen && index === 0 ? " on" : ""}`}
          >
            <div className="lf-stack">
              <strong>{option.title}</strong>
              {option.sub ? (
                <span className="lf-caption">{option.sub}</span>
              ) : null}
            </div>
            <i className="lf-radio" />
          </div>
        ))}
        <span className="lf-spacer" />
        <div className={chosen ? "lf-btn" : "lf-btn lf-btn-off"}>Continue</div>
      </div>
      <TabBar active={4} />
    </>
  );
}

export const LOFI_SHOTS = [
  { id: "home", label: "Home", Screen: Home },
  { id: "search", label: "Search", Screen: SearchScreen },
  { id: "filters", label: "Filters", Screen: () => <Filters applied={false} /> },
  { id: "filters-applied", label: "Filters · applied", Screen: () => <Filters applied /> },
  { id: "detail", label: "Detail · confirm", Screen: Detail },
  { id: "summary", label: "Summary", Screen: Summary },
  { id: "choice", label: "Choice", Screen: () => <Choice chosen={false} /> },
  { id: "choice-selected", label: "Choice · selected", Screen: () => <Choice chosen /> },
];

export function LofiShot({ Screen }) {
  return (
    <div className="lf">
      <StatusBar />
      <Screen />
    </div>
  );
}
