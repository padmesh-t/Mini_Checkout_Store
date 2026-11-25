import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure demo directory exists
const demoDir = path.resolve('demo');
if (!fs.existsSync(demoDir)) {
  fs.mkdirSync(demoDir, { recursive: true });
}

// Function to poll until server is up
async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) return true;
    } catch (e) {
      // wait and retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} failed to start within ${timeoutMs}ms`);
}

async function run() {
  console.log('1. Starting local Vite development server...');
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npx.cmd' : 'npx';
  const viteProcess = spawn(npmCmd, ['vite', '--port', '5173'], {
    stdio: 'ignore',
    shell: true,
  });

  try {
    await waitForServer('http://localhost:5173');
    console.log('✓ Vite server is running at http://localhost:5173');

    console.log('2. Launching Playwright with high-definition video recording (1280x720)...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      recordVideo: {
        dir: demoDir,
        size: { width: 1280, height: 720 },
      },
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Helper: On-screen Presentation HUD
    const showHUD = async (stepTag, title, description, pauseMs = 3000) => {
      await page.evaluate(
        ({ stepTag, title, description }) => {
          let hud = document.getElementById('demo-hud');
          if (!hud) {
            hud = document.createElement('div');
            hud.id = 'demo-hud';
            hud.style.position = 'fixed';
            hud.style.bottom = '20px';
            hud.style.left = '50%';
            hud.style.transform = 'translateX(-50%)';
            hud.style.zIndex = '999999';
            hud.style.maxWidth = '900px';
            hud.style.width = '90%';
            hud.style.background = 'rgba(15, 23, 42, 0.96)';
            hud.style.backdropFilter = 'blur(12px)';
            hud.style.color = '#ffffff';
            hud.style.padding = '14px 22px';
            hud.style.borderRadius = '12px';
            hud.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.5)';
            hud.style.fontFamily = 'Inter, system-ui, sans-serif';
            hud.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            document.body.appendChild(hud);
          }
          hud.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #2563eb; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">
                  ${stepTag}
                </span>
                <span style="font-size: 15px; font-weight: 700; color: #f8fafc;">
                  ${title}
                </span>
              </div>
              <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Mini Checkout Store Demo</span>
            </div>
            <div style="font-size: 13.5px; color: #cbd5e1; line-height: 1.4;">
              ${description}
            </div>
          `;
        },
        { stepTag, title, description }
      );
      await page.waitForTimeout(pauseMs);
    };

    // Helper: Element visual pulse
    const highlight = async (sel) => {
      await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          el.style.outline = '3px solid #2563eb';
          el.style.outlineOffset = '4px';
          setTimeout(() => {
            el.style.outline = 'none';
          }, 1800);
        }
      }, sel);
    };

    console.log('3. Navigating and starting video demonstration scenes...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Scene 1: Introduction
    await showHUD(
      'DEMO START',
      'System Architecture & Overview',
      'A responsive single-page checkout built with React and tested with Playwright. Features dynamic math, input validation, and double-click prevention.',
      3500
    );

    // Scene 2: Synthetic Products & Cart Initial State
    await highlight('[data-testid="catalog-prod-keyboard"]');
    await showHUD(
      'FEATURE 1',
      'Two Synthetic Products with Fixed Pricing',
      'Mechanical Keyboard ($75.00) and Wireless Mouse ($25.00). The initial cart pre-loads 1 of each ($100.00 subtotal).',
      3200
    );

    // Scene 3: Dynamic Calculations
    await showHUD(
      'FEATURE 2',
      'Reactive Calculations & Line Totals',
      'Increasing Keyboard quantity from 1 to 2. Line total dynamically updates to $150.00 and order total to $175.00.',
      2800
    );
    await highlight('[data-testid="increment-qty-prod-keyboard"]');
    await page.getByTestId('increment-qty-prod-keyboard').click();
    await highlight('[data-testid="line-total-prod-keyboard"]');
    await highlight('[data-testid="order-total-amount"]');
    await page.waitForTimeout(2000);

    // Scene 4: Removing and Re-adding items
    await showHUD(
      'FEATURE 2 (cont)',
      'Item Removal and Re-Addition',
      'Decrementing Wireless Mouse to 0 removes it. Total drops to $150.00. Clicking "+ Add to Cart" re-adds it at $25.00.',
      3000
    );
    await page.getByTestId('decrement-qty-prod-mouse').click();
    await highlight('[data-testid="order-total-amount"]');
    await page.waitForTimeout(1600);
    await page.getByTestId('add-to-cart-prod-mouse').click();
    await highlight('[data-testid="cart-item-prod-mouse"]');
    await page.waitForTimeout(2000);

    // Scene 5: Empty Cart Validation Guard
    await showHUD(
      'EDGE GUARD 1',
      'Handling Mistakes: Empty Cart Prevention',
      'Removing all items from the cart. Attempting to place an order blocks checkout with an explicit warning notice.',
      3200
    );
    await page.getByTestId('remove-item-prod-keyboard').click();
    await page.getByTestId('remove-item-prod-mouse').click();
    await page.getByTestId('customer-name-input').fill('Alice Johnson');
    await page.waitForTimeout(1000);
    await page.getByTestId('place-order-button').click();
    await highlight('[data-testid="empty-cart-error"]');
    await page.waitForTimeout(3000);

    // Scene 6: Missing Field Validation & Data Preservation
    await showHUD(
      'EDGE GUARD 2',
      'Form Validation with Input Preservation',
      'Re-adding items. Submitting with Full Name blank while entering Email. Order is blocked, and entered Email is strictly preserved.',
      3400
    );
    await page.getByTestId('add-to-cart-prod-keyboard').click();
    await page.getByTestId('add-to-cart-prod-mouse').click();
    await page.getByTestId('customer-name-input').fill('');
    await page.getByTestId('customer-email-input').fill('alice.johnson@example.com');
    await page.waitForTimeout(1000);
    await page.getByTestId('place-order-button').click();
    await highlight('[data-testid="name-validation-error"]');
    await highlight('[data-testid="customer-email-input"]');
    await page.waitForTimeout(3000);

    // Scene 7: Double-Click Security Protection
    await showHUD(
      'SECURITY GUARD',
      'Rapid Double-Click Prevention',
      'Entering customer name. Rapid double-clicking "Place Order" activates button lock, preventing duplicate confirmations.',
      3400
    );
    await page.getByTestId('customer-name-input').fill('Alice Johnson');
    await page.waitForTimeout(800);
    const placeBtn = page.getByTestId('place-order-button');
    await placeBtn.dblclick();
    await page.waitForTimeout(1200);

    // Scene 8: Order Confirmation View
    await showHUD(
      'SUCCESS STATE',
      'Order Confirmation & Unique Reference',
      'Checkout complete! System displays unique reference code (ORD-XXXXXX-XXX), customer greeting, itemized breakdown, and total paid.',
      3800
    );
    await highlight('[data-testid="order-reference"]');
    await highlight('[data-testid="confirmation-total"]');
    await page.waitForTimeout(2500);

    // Scene 9: Reset Order & Automated Tests Summary
    await showHUD(
      'SUMMARY',
      'Clean State Reset & Automated Test Suite',
      'Clicking "Place Another Order" cleanly resets the application. All 5 automated Playwright browser tests pass at 100%.',
      3500
    );
    await page.getByTestId('place-another-order-btn').click();
    await page.waitForTimeout(2000);

    console.log('4. Finalizing recording and saving video...');
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const originalPath = await video.path();
      const finalVideoPath = path.join(demoDir, 'mini-checkout-demo.webm');
      if (fs.existsSync(finalVideoPath)) {
        fs.unlinkSync(finalVideoPath);
      }
      fs.copyFileSync(originalPath, finalVideoPath);
      console.log(`\n🎉 Professional Demo Video recorded successfully!`);
      console.log(`Video Location: ${finalVideoPath}`);
    }
  } finally {
    // Kill Vite process tree
    try {
      if (isWindows && viteProcess.pid) {
        spawn('taskkill', ['/pid', viteProcess.pid.toString(), '/f', '/t']);
      } else {
        viteProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error('Error during demo recording:', err);
  process.exit(1);
});
