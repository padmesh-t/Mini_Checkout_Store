# Mini Checkout and Browser Test Suite

A lightweight single-page checkout web application built with **React** and an automated browser test suite powered by **Playwright**.

---

## 🌟 Features Implemented

1. **Synthetic Products & Cart System:**
   - **Mechanical Keyboard** ($75.00)
   - **Wireless Mouse** ($25.00)
   - Ability to add items, increment/decrement quantities, and remove items.
   - Dynamic real-time calculation of line totals and grand order total.
2. **Defensive Form Validation:**
   - Required customer identifier: **Full Name**.
   - Missing required field triggers a clear error alert while **preserving** user-entered form data (e.g., email).
   - Empty cart checkout is actively blocked with a clear warning notice.
3. **Duplicate Submission Protection:**
   - Submissions are locked instantly on click (`isSubmitting` flag and disabled state).
   - Rapid double-clicks or repeated clicks are prevented from generating multiple confirmations.
4. **Order Confirmation:**
   - Successful checkout displays an order confirmation screen with a unique reference code (`ORD-XXXXXX-XXX`), itemized receipt, and customer greeting.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or higher; tested on v24.x)
- npm

### 1. Installation
Clone or navigate to the repository directory and run:
```bash
npm install
```

If running Playwright for the first time on a fresh environment:
```bash
npx playwright install chromium
```

### 2. Run the Web Application
To start the development server locally:
```bash
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🎥 Demonstration Videos & Walkthrough

Two demonstration videos are available in the repository:

1. **🎙️ Narrated Video with Voiceover:**
   - **File:** [`demo/mini-checkout-demo-with-voice.mp4`](./demo/mini-checkout-demo-with-voice.mp4)
   - **Format:** MP4 (H.264 / AAC, 1280×720) — Plays universally across any browser, phone, or media player.
   - Features studio-quality synchronized voiceover explaining each feature, calculation, edge guard, and test.

2. **📺 Subtitled HUD Video (Silent):**
   - **File:** [`demo/mini-checkout-demo.webm`](./demo/mini-checkout-demo.webm)
   - **Format:** WebM (VP9, 1280×720) — Features on-screen floating presentation HUD banners and animated element outlines.

- **Voiceover & Scene Script:** See [`DEMO_WALKTHROUGH.md`](./DEMO_WALKTHROUGH.md) for the complete timestamped presentation script.

### Re-recording or Regenerating Videos:
- **Record new browser session video:** `npm run demo:record`
- **Generate synchronized voiceover MP4:** `npm run demo:voice`

---

## 🧪 Running the Browser Test Suite

The automated tests are written with **Playwright**, utilizing web-first assertions and automatic dev-server integration.

### Run All Automated Tests (Headless)
```bash
npm test
```

### Run Tests in Headed Mode (Visible Chrome Window)
```bash
npm run test:headed
```

### Run Tests in Interactive UI Mode
```bash
npm run test:ui
```

### View Test Report
```bash
npm run test:report
```

---

## 📋 Automated Checks Overview

The suite (`tests/checkout.spec.js`) validates:

1. **Check 1: Happy Path Checkout Confirmation**
   - Verifies placing an order with valid data displays the order confirmation screen, order summary, and a unique reference code matching `ORD-\d{6}-\d{3}`.
2. **Check 2: Missing Required Field Validation & State Preservation**
   - Verifies submitting with a blank Full Name blocks checkout, shows an inline validation error, and preserves non-empty fields (e.g. Email).
3. **Check 3: Real-Time Dynamic Cart Calculations**
   - Verifies changing product quantity increments line items and updates the exact grand total dynamically ($100.00 $\rightarrow$ $175.00 $\rightarrow$ $150.00 $\rightarrow$ $175.00).
4. **Edge Check 4: Empty Cart Prevention**
   - Verifies attempting to checkout with an empty cart is blocked with an alert.
5. **Edge Check 5: Rapid Double-Click Protection**
   - Verifies rapid double-clicking on "Place Order" yields exactly one confirmation.

---

## 📂 Project Structure

```
├── src/
│   ├── App.jsx            # Single-page checkout application logic
│   ├── index.css          # Clean modern styling & layout
│   └── main.jsx           # React DOM root entry
├── tests/
│   └── checkout.spec.js   # Playwright automated browser test suite
├── index.html             # HTML entry point
├── package.json           # Dependencies and scripts
├── playwright.config.js   # Playwright test runner configuration
├── TEST_PLAN.md           # Test strategy, manual test logs, & defect analysis
└── README.md              # Project documentation & run guides
```

---

## 📑 Test Plan & Manual Testing
See [TEST_PLAN.md](./TEST_PLAN.md) for the prioritized risk assessment matrix, manual testing execution logs (Empty Cart & Rapid Double-Click), and defect reporting results.
