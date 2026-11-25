import { test, expect } from '@playwright/test';

test.describe('Mini Checkout Suite - Automated Checks', () => {

  test.beforeEach(async ({ page }) => {
    // Start each check from a clean browser state and freshly loaded application
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Express Checkout' })).toBeVisible();
  });

  /**
   * Check 1: Successful Checkout produces a confirmation with reference
   */
  test('Check 1: Successful checkout produces an order confirmation with unique reference', async ({ page }) => {
    // Ensure initial cart displays standard products
    await expect(page.getByTestId('cart-item-prod-keyboard')).toBeVisible();
    await expect(page.getByTestId('cart-item-prod-mouse')).toBeVisible();
    await expect(page.getByTestId('order-total-amount')).toHaveText('$100.00');

    // Fill customer required information
    const customerNameInput = page.getByTestId('customer-name-input');
    await customerNameInput.fill('Sarah Jenkins');

    const customerEmailInput = page.getByTestId('customer-email-input');
    await customerEmailInput.fill('sarah.jenkins@example.com');

    // Click Place Order
    const placeOrderBtn = page.getByTestId('place-order-button');
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // Assert customer sees order confirmation
    const confirmation = page.getByTestId('order-confirmation');
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByRole('heading', { name: 'Order Placed Successfully!' })).toBeVisible();

    // Verify order reference is clearly generated and matches expected format
    const refLocator = page.getByTestId('order-reference');
    await expect(refLocator).toBeVisible();
    const refText = await refLocator.innerText();
    expect(refText).toMatch(/^ORD-\d{6}-\d{3}$/);

    // Verify confirmed customer name and total
    await expect(page.getByTestId('confirmed-customer-name')).toHaveText('Sarah Jenkins');
    await expect(page.getByTestId('confirmation-total')).toHaveText('$100.00');
  });

  /**
   * Check 2: Missing required field blocks checkout and displays validation message
   */
  test('Check 2: Missing required field blocks checkout, displays validation error, and preserves entered data', async ({ page }) => {
    // Leave required 'Full Name' field blank
    const customerNameInput = page.getByTestId('customer-name-input');
    await customerNameInput.fill('');

    // Enter optional email to verify data preservation
    const customerEmailInput = page.getByTestId('customer-email-input');
    const testEmail = 'preserved.user@example.com';
    await customerEmailInput.fill(testEmail);

    // Attempt to place order
    const placeOrderBtn = page.getByTestId('place-order-button');
    await placeOrderBtn.click();

    // Assert checkout is blocked: Confirmation screen must NOT be visible
    await expect(page.getByTestId('order-confirmation')).not.toBeVisible();

    // Assert customer sees clear validation message
    const errorBanner = page.getByTestId('name-validation-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Full Name is required');

    // Assert customer's entered email is strictly preserved
    await expect(customerEmailInput).toHaveValue(testEmail);
  });

  /**
   * Check 3: Quantity change updates line totals and exact order total dynamically
   */
  test('Check 3: Quantity modification updates line totals and exact order total dynamically', async ({ page }) => {
    // Initial verification:
    // Keyboard: 1 x $75 = $75.00
    // Mouse: 1 x $25 = $25.00
    // Total: $100.00
    await expect(page.getByTestId('line-total-prod-keyboard')).toHaveText('$75.00');
    await expect(page.getByTestId('line-total-prod-mouse')).toHaveText('$25.00');
    await expect(page.getByTestId('order-total-amount')).toHaveText('$100.00');

    // Step 1: Increase Keyboard quantity to 2
    const incKeyboardBtn = page.getByTestId('increment-qty-prod-keyboard');
    await incKeyboardBtn.click();

    // Assert quantity updates to 2
    await expect(page.getByTestId('qty-value-prod-keyboard')).toHaveText('2');
    // Assert line total updates to 2 * $75 = $150.00
    await expect(page.getByTestId('line-total-prod-keyboard')).toHaveText('$150.00');
    // Assert exact order total updates to $150.00 + $25.00 = $175.00
    await expect(page.getByTestId('order-total-amount')).toHaveText('$175.00');
    await expect(page.getByTestId('place-order-button')).toContainText('$175.00');

    // Step 2: Remove Mouse by clicking decrement when quantity is 1
    const decMouseBtn = page.getByTestId('decrement-qty-prod-mouse');
    await decMouseBtn.click();

    // Assert Mouse item is removed from cart
    await expect(page.getByTestId('cart-item-prod-mouse')).not.toBeVisible();
    // Assert exact order total updates to $150.00
    await expect(page.getByTestId('order-total-amount')).toHaveText('$150.00');

    // Step 3: Re-add Mouse from Available Products catalog
    const addMouseBtn = page.getByTestId('add-to-cart-prod-mouse');
    await addMouseBtn.click();

    // Assert Mouse is back in cart with 1 x $25.00
    await expect(page.getByTestId('cart-item-prod-mouse')).toBeVisible();
    await expect(page.getByTestId('line-total-prod-mouse')).toHaveText('$25.00');
    // Assert exact grand total returns to $175.00
    await expect(page.getByTestId('order-total-amount')).toHaveText('$175.00');
  });

  /**
   * Additional Check 4: Empty Cart Checkout Prevention
   */
  test('Edge Check: Empty cart blocks checkout with clear validation notice', async ({ page }) => {
    // Remove all items from cart
    await page.getByTestId('remove-item-prod-keyboard').click();
    await page.getByTestId('remove-item-prod-mouse').click();

    // Assert cart is empty
    await expect(page.getByTestId('empty-cart-message')).toBeVisible();
    await expect(page.getByTestId('order-total-amount')).toHaveText('$0.00');

    // Fill customer name
    await page.getByTestId('customer-name-input').fill('Alice Walker');

    // Attempt checkout
    await page.getByTestId('place-order-button').click();

    // Assert checkout blocked
    await expect(page.getByTestId('order-confirmation')).not.toBeVisible();
    const emptyError = page.getByTestId('empty-cart-error');
    await expect(emptyError).toBeVisible();
    await expect(emptyError).toContainText('Your cart is empty');
  });

  /**
   * Additional Check 5: Rapid Double-Click Protection
   */
  test('Edge Check: Rapid double-click on Place Order does not produce duplicate confirmations', async ({ page }) => {
    await page.getByTestId('customer-name-input').fill('Fast Clicker');

    const placeOrderBtn = page.getByTestId('place-order-button');

    // Perform rapid double click
    await placeOrderBtn.dblclick();

    // Verify exactly one order confirmation container is displayed
    const confirmations = page.getByTestId('order-confirmation');
    await expect(confirmations).toHaveCount(1);
    await expect(page.getByTestId('order-reference')).toBeVisible();
  });

});
