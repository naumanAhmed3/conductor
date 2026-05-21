import type { Flow, FlowStep } from './types';

// ─────────────────────────────────────────────────────────────
// Sample flows shipped with Conductor. Each targets a real, public,
// automation-friendly sandbox site. They are framed around the kind
// of work an access / inventory review does against a SaaS app:
// log in, confirm reachability, pull a directory, audit a catalog.
// ─────────────────────────────────────────────────────────────

interface FlowSeed {
  id: string;
  name: string;
  description: string;
  startUrl: string;
  steps: FlowStep[];
  tags: string[];
  schedule: string | null;
}

const SEEDS: FlowSeed[] = [
  {
    id: 'saucedemo-access-check',
    name: 'SauceDemo · login & catalog access check',
    description:
      'Signs into the SauceDemo storefront with a standard account and confirms the product catalog is reachable — the kind of smoke check an access review runs against a SaaS application.',
    startUrl: 'https://www.saucedemo.com/',
    tags: ['auth', 'access-review'],
    schedule: 'daily',
    steps: [
      { action: 'fill', label: 'Enter username', selector: '#user-name', value: 'standard_user' },
      { action: 'fill', label: 'Enter password', selector: '#password', value: 'secret_sauce' },
      { action: 'click', label: 'Submit login', selector: '#login-button' },
      { action: 'waitFor', label: 'Wait for the catalog to load', selector: '.inventory_list' },
      { action: 'assertText', label: 'Confirm the Products page', selector: '.title', contains: 'Products' },
      { action: 'extract', label: 'Capture the visible product names', selector: '.inventory_item_name', as: 'products', multiple: true },
    ],
  },
  {
    id: 'saucedemo-checkout',
    name: 'SauceDemo · end-to-end checkout journey',
    description:
      'A deep regression flow: authenticate, add an item to the cart, work through the two-step checkout, and assert the order-confirmation screen — thirteen steps end to end.',
    startUrl: 'https://www.saucedemo.com/',
    tags: ['e2e', 'regression'],
    schedule: null,
    steps: [
      { action: 'fill', label: 'Enter username', selector: '#user-name', value: 'standard_user' },
      { action: 'fill', label: 'Enter password', selector: '#password', value: 'secret_sauce' },
      { action: 'click', label: 'Submit login', selector: '#login-button' },
      { action: 'waitFor', label: 'Wait for the catalog', selector: '.inventory_list' },
      { action: 'click', label: 'Add the backpack to the cart', selector: '#add-to-cart-sauce-labs-backpack' },
      { action: 'click', label: 'Open the cart', selector: '.shopping_cart_link' },
      { action: 'waitFor', label: 'Wait for the cart contents', selector: '.cart_list' },
      { action: 'click', label: 'Start checkout', selector: '#checkout' },
      { action: 'fill', label: 'Enter first name', selector: '#first-name', value: 'Ada' },
      { action: 'fill', label: 'Enter last name', selector: '#last-name', value: 'Lovelace' },
      { action: 'fill', label: 'Enter postal code', selector: '#postal-code', value: '94016' },
      { action: 'click', label: 'Continue to the overview', selector: '#continue' },
      { action: 'click', label: 'Finish the order', selector: '#finish' },
      { action: 'assertText', label: 'Confirm the order completed', selector: '.complete-header', contains: 'Thank you for your order' },
    ],
  },
  {
    id: 'quotes-directory',
    name: 'Quotes · author & topic directory extraction',
    description:
      'Scrapes a structured directory from a page — every author, topic tag, and quote — exactly how Conductor would pull a member or role list out of a SaaS admin console.',
    startUrl: 'https://quotes.toscrape.com/',
    tags: ['scrape', 'directory'],
    schedule: 'daily',
    steps: [
      { action: 'waitFor', label: 'Wait for the quote list', selector: '.quote' },
      { action: 'extract', label: 'Extract every author', selector: '.quote .author', as: 'authors', multiple: true },
      { action: 'extract', label: 'Extract every topic tag', selector: '.tag', as: 'topics', multiple: true },
      { action: 'extract', label: 'Extract every quote', selector: '.quote .text', as: 'quotes', multiple: true },
    ],
  },
  {
    id: 'books-inventory-audit',
    name: 'Books · catalog price & stock audit',
    description:
      'Audits an online catalog — collecting titles, prices, and stock status across the page — the inventory-and-spend half of a SaaS review applied to a real storefront.',
    startUrl: 'https://books.toscrape.com/',
    tags: ['scrape', 'inventory'],
    schedule: null,
    steps: [
      { action: 'waitFor', label: 'Wait for the catalog grid', selector: '.product_pod' },
      { action: 'extract', label: 'Extract book titles', selector: '.product_pod h3 a', as: 'titles', attr: 'title', multiple: true },
      { action: 'extract', label: 'Extract prices', selector: '.product_pod .price_color', as: 'prices', multiple: true },
      { action: 'extract', label: 'Extract stock status', selector: '.product_pod .instock.availability', as: 'availability', multiple: true },
    ],
  },
  {
    id: 'the-internet-secure-login',
    name: 'The Internet · secure-area login audit',
    description:
      'Verifies a credentialed login path end to end: submit the form, wait for the flash banner, and assert the account actually reached the protected secure area.',
    startUrl: 'https://the-internet.herokuapp.com/login',
    tags: ['auth', 'access-review'],
    schedule: 'daily',
    steps: [
      { action: 'fill', label: 'Enter username', selector: '#username', value: 'tomsmith' },
      { action: 'fill', label: 'Enter password', selector: '#password', value: 'SuperSecretPassword!' },
      { action: 'click', label: 'Submit the login form', selector: 'button[type="submit"]' },
      { action: 'waitFor', label: 'Wait for the result banner', selector: '#flash' },
      { action: 'assertText', label: 'Confirm the secure area was reached', selector: '#flash', contains: 'You logged into a secure area' },
      { action: 'extract', label: 'Capture the secure-area heading', selector: '.example h2', as: 'area' },
    ],
  },
];

/** The sample flows, ready to insert. */
export function sampleFlows(): Flow[] {
  const now = new Date().toISOString();
  return SEEDS.map((s) => ({
    ...s,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  }));
}
