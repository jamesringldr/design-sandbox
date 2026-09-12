export default function SelfScanEntry() {
  return (
    <div className="wf" aria-label="Self scan">
      <div className="wf-page" aria-hidden="true">
        <div className="wf-logo" />
        <div className="wf-hero" />
        <div className="wf-line wf-line-lg" />
        <div className="wf-line wf-line-md" />
        <div className="wf-cta-ghost" />
      </div>

      <div className="wf-overlay" aria-hidden="true" />

      <section className="wf-sheet" role="dialog" aria-labelledby="wf-selfscan-title">
        <div className="wf-sheet-chrome">
          <div className="wf-handle" />
          <span className="wf-close" aria-hidden="true">
            ×
          </span>
        </div>

        <div className="wf-sheet-body">
          <div className="wf-center">
            <div className="wf-pill">
              <span className="wf-spark" />
              Real results in about 3 minutes
            </div>
            <h1 id="wf-selfscan-title" className="wf-title">
              Are you exposed?
            </h1>
            <p className="wf-sub">Name and zip is enough to start</p>
          </div>

          <div className="wf-privacy">
            <h2 className="wf-heading">Your privacy is paramount</h2>
            <ul className="wf-bullets">
              <li>SelfScans do not create a profile for you</li>
              <li>We do not save data from your SelfScan</li>
              <li>
                SelfScan data is never sold, shared, or used to send you
                marketing
              </li>
            </ul>
          </div>

          <div className="wf-fields">
            <div className="wf-input wf-input-focus">
              First Name <em>(legal name is best)</em>
            </div>
            <div className="wf-input">Last Name</div>
            <div className="wf-input">Zip Code</div>
          </div>

          <p className="wf-helper">No credit card or sign up required</p>
          <div className="wf-submit">Run a SelfScan</div>
          <p className="wf-legal">
            By running a SelfScan you agree to
            <br />
            Vanyshr&apos;s Terms of Service and Privacy Policy
          </p>
        </div>
      </section>
    </div>
  );
}
