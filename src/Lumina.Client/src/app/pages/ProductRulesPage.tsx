export function ProductRulesPage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.6' }}>
      <h1>Lumina Product Model (v1)</h1>
      
      <h2>Client</h2>
      <p>A permanent record of a person.</p>
      
      <h2>Package</h2>
      <p>A product that can be purchased (example: 3-Month Coaching).</p>
      
      <h2>Client Package</h2>
      <p>Every time a client purchases a package, create a NEW record.</p>
      <p>Clients may have multiple packages over time.</p>
      
      <h2>Session</h2>
      <p>Sessions must belong to BOTH:</p>
      <ul>
        <li>Client</li>
        <li>Client Package</li>
      </ul>
      <p>Every session is tied to a specific package.</p>
      
      <h2>UI Rules</h2>
      <ul>
        <li>Page titles live in the main content area — never in the global header</li>
        <li>Primary action buttons align to the right of the page title</li>
        <li>The global header is not contextual</li>
        <li>Packages must display statuses such as Active and Completed</li>
      </ul>
      
      <p><em>This page is for internal product rules only.</em></p>
    </div>
  );
}