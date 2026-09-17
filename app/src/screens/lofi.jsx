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

function TileCard({ tall, children }) {
  return (
    <div className="lf-tile-card">
      <div className={`lf-tile${tall ? " lf-tile-tall" : ""}`} />
      <span className="lf-caption lf-tile-caption">{children}</span>
    </div>
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
              <TileCard key={name} tall>
                {name}
              </TileCard>
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
          <div className="lf-tile-card">
            <div className="lf-banner" />
            <span className="lf-caption lf-tile-caption">Spring session</span>
          </div>
        </Section>
      </div>
      <TabBar active={0} />
    </>
  );
}

function Landing() {
  return (
    <div className="lf-body lf-landing">
      <div className="lf-preview">
        <span className="lf-preview-notch" />
        <span className="lf-badge">New</span>
        <strong>Pick up where you left off</strong>
        <div className="lf-item lf-item-compact">
          <div className="lf-thumb lf-thumb-sm" />
          <div className="lf-stack">
            <strong>Item title</strong>
            <span className="lf-caption">Category · 12 items</span>
          </div>
        </div>
        <span className="lf-label">Suggested</span>
        <div className="lf-item lf-item-compact">
          <span className="lf-avatar" />
          <div className="lf-stack lf-grow">
            <strong>All collections</strong>
            <span className="lf-caption">Everything you have saved</span>
          </div>
          <span className="lf-chev">›</span>
        </div>
        <div className="lf-btn lf-btn-ghost">Continue</div>
      </div>
      <span className="lf-spacer" />
      <h1 className="lf-hero-title">
        Everything <span className="lf-accent">you</span> need, in one place
      </h1>
      <p className="lf-copy lf-center">
        A short line that explains what the app does and why it helps.
      </p>
      <div className="lf-dots" aria-hidden="true">
        <i />
        <i />
        <i className="on" />
      </div>
      <span className="lf-spacer" />
      <div className="lf-btn lf-btn-pill">Get started</div>
    </div>
  );
}

function Dashboard() {
  const stats = [
    { label: "Active", value: "128", delta: "+12%" },
    { label: "Completed", value: "46", delta: "+4%" },
  ];
  const bars = [40, 65, 50, 80, 55, 92, 70];
  return (
    <>
      <div className="lf-body">
        <div className="lf-row lf-gap-8">
          <span className="lf-avatar" />
          <div className="lf-stack lf-grow">
            <span className="lf-caption">Good morning</span>
            <strong>Alex Morgan</strong>
          </div>
          <span className="lf-icon-box" />
        </div>
        <div className="lf-grid-2">
          {stats.map((stat) => (
            <div key={stat.label} className="lf-stat">
              <span className="lf-caption">{stat.label}</span>
              <span className="lf-stat-value">{stat.value}</span>
              <span className="lf-delta">{stat.delta}</span>
            </div>
          ))}
        </div>
        <Section title="This week">
          <div className="lf-chart">
            {bars.map((height, index) => (
              <span
                key={index}
                className={index === 5 ? "on" : ""}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </Section>
        <Section title="Recent activity">
          <div className="lf-stack">
            <RowLink title="Item updated" sub="2 min ago" />
            <RowLink title="New item added" sub="1 hr ago" />
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
            {["Outdoor", "Studio", "Travel", "Home", "Tools", "Kids"].map((name) => (
              <TileCard key={name}>{name}</TileCard>
            ))}
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

function Filters() {
  const options = ["Popular", "Newest", "Closest", "Highest rated"];
  const sizes = ["XS", "S", "M", "L", "XL"];
  return (
    <>
      <TopBar title="Filters" action="Clear" />
      <div className="lf-body">
        <div className="lf-field-group">
          <span className="lf-label">Sort by</span>
          <span className="lf-select on">
            Newest <b>›</b>
          </span>
        </div>
        <div className="lf-input">Name contains</div>
        <Section title="Type">
          <ul className="lf-radios">
            {options.map((option, index) => (
              <li key={option} className={index === 1 ? "on" : ""}>
                <i />
                {option}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Price">
          <div className="lf-slider">
            <span className="lf-slider-fill" style={{ right: "38%" }} />
            <span className="lf-slider-knob" style={{ left: "62%" }} />
          </div>
          <span className="lf-caption">$0 – $120</span>
        </Section>
        <Section title="Size">
          <div className="lf-row lf-gap-8">
            {sizes.map((size) => (
              <span
                key={size}
                className={`lf-seg${size === "M" ? " on" : ""}`}
              >
                {size}
              </span>
            ))}
          </div>
        </Section>
        <span className="lf-spacer" />
        <div className="lf-btn">Show 24 results</div>
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

function Field({ label, value, placeholder, focused, multiline }) {
  const classes = ["lf-input"];
  if (value) classes.push("filled");
  if (focused) classes.push("focus");
  if (multiline) classes.push("lf-textarea");
  return (
    <label className="lf-field-group lf-field">
      <span className="lf-label">{label}</span>
      <span className={classes.join(" ")}>
        {value || placeholder}
        {focused ? <i className="lf-caret" /> : null}
      </span>
    </label>
  );
}

function Form() {
  return (
    <>
      <TopBar title="Edit profile" action="Cancel" />
      <div className="lf-body">
        <Section title="Filled">
          <Field label="Full name" value="Alex Morgan" />
          <Field label="Email" value="alex@example.com" focused />
        </Section>
        <Section title="Empty">
          <Field label="Phone" placeholder="(555) 000-0000" />
          <Field label="Bio" placeholder="Tell people about yourself" multiline />
        </Section>
        <span className="lf-spacer" />
        <div className="lf-btn">Save</div>
      </div>
    </>
  );
}

function Choice() {
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
            className={`lf-option${index === 0 ? " on" : ""}`}
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
        <div className="lf-btn">Continue</div>
      </div>
      <TabBar active={4} />
    </>
  );
}

export const LOFI_SHOTS = [
  { id: "landing", label: "Landing", Screen: Landing },
  { id: "home", label: "Home", Screen: Home },
  { id: "dashboard", label: "Dashboard", Screen: Dashboard },
  { id: "search", label: "Search", Screen: SearchScreen },
  { id: "filters-applied", label: "Filters · applied", Screen: Filters },
  { id: "detail", label: "Detail · confirm", Screen: Detail },
  { id: "form", label: "Form · empty + filled", Screen: Form },
  { id: "choice-selected", label: "Choice · selected", Screen: Choice },
];

export function LofiShot({ Screen }) {
  return (
    <div className="lf">
      <StatusBar />
      <Screen />
    </div>
  );
}
