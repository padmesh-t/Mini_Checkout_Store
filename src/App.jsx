import React, { useState, useRef } from 'react';

// The two synthetic products with fixed prices
export const PRODUCTS = [
  {
    id: 'prod-keyboard',
    name: 'Mechanical Keyboard',
    description: 'Custom hot-swappable RGB mechanical keyboard',
    price: 75.00,
  },
  {
    id: 'prod-mouse',
    name: 'Wireless Mouse',
    description: 'Precision ergonomic wireless gaming mouse',
    price: 25.00,
  },
];

export default function App() {
  // Cart state: map of productId -> quantity
  // Starts with 1 keyboard and 1 mouse in cart for quick checkout experience
  const [cart, setCart] = useState({
    'prod-keyboard': 1,
    'prod-mouse': 1,
  });

  // Customer form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Submission / Double-click protection state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  // Ref tracking total placed orders to guarantee no double-placement
  const orderCountRef = useRef(0);

  // Helper calculation functions
  const getItemQuantity = (productId) => cart[productId] || 0;

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = currentQty + delta;
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = newQty;
      }
      return updated;
    });
    // Clear empty-cart error if items are added
    if (errors.cart) {
      setErrors((prev) => ({ ...prev, cart: undefined }));
    }
  };

  const removeItem = (productId) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const addToCart = (productId) => {
    updateQuantity(productId, 1);
  };

  // Calculate totals
  const cartEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);
  const totalItemCount = cartEntries.reduce((sum, [_, qty]) => sum + qty, 0);

  const orderTotal = cartEntries.reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  // Form input change handler (preserves customer input)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Checkout submission handler
  const handlePlaceOrder = (e) => {
    if (e) e.preventDefault();

    // Guard: Prevent double-submission if already submitting or already confirmed
    if (isSubmitting || orderConfirmation) {
      return;
    }

    const validationErrors = {};

    // Check 1: Cart must not be empty
    if (totalItemCount === 0) {
      validationErrors.cart = 'Your cart is empty. Please add at least one product before placing an order.';
    }

    // Check 2: Required customer name must not be blank
    if (!formData.fullName || !formData.fullName.trim()) {
      validationErrors.fullName = 'Full Name is required to place your order.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Set submitting flag immediately to block concurrent/rapid clicks
    setIsSubmitting(true);
    setErrors({});

    // Snapshot order details
    const orderItems = cartEntries.map(([id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      return {
        id,
        name: product.name,
        price: product.price,
        quantity: qty,
        lineTotal: product.price * qty,
      };
    });

    // Simulate reliable order processing
    orderCountRef.current += 1;
    const generatedReference = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const confirmationData = {
      orderReference: generatedReference,
      customer: { ...formData },
      items: orderItems,
      totalAmount: orderTotal,
      placedAt: new Date().toLocaleTimeString(),
      placementSequence: orderCountRef.current,
    };

    // Transition directly to confirmation
    setOrderConfirmation(confirmationData);
    setIsSubmitting(false);
  };

  // Reset to place a new order
  const handleResetOrder = () => {
    setCart({
      'prod-keyboard': 1,
      'prod-mouse': 1,
    });
    setFormData({
      fullName: '',
      email: '',
    });
    setErrors({});
    setIsSubmitting(false);
    setOrderConfirmation(null);
  };

  return (
    <div className="checkout-page">
      <header className="page-header">
        <span className="brand-badge">Official Store</span>
        <h1 className="store-title">Express Checkout</h1>
        <p className="store-subtitle">Fast, secure, single-page customer checkout experience</p>
      </header>

      {/* Confirmation View */}
      {orderConfirmation ? (
        <section className="card confirmation-container" data-testid="order-confirmation">
          <div className="success-badge-icon">✓</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
            Order Placed Successfully!
          </h2>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
            Thank you, <strong data-testid="confirmed-customer-name">{orderConfirmation.customer.fullName}</strong>. A confirmation has been generated.
          </p>

          <div className="order-reference-box">
            <div className="ref-label">Order Reference</div>
            <div className="ref-code" data-testid="order-reference">
              {orderConfirmation.orderReference}
            </div>
          </div>

          <div className="order-receipt">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Order Summary
            </h3>
            {orderConfirmation.items.map((item) => (
              <div key={item.id} className="receipt-row">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="receipt-row receipt-total">
              <span>Total Paid</span>
              <span data-testid="confirmation-total">${orderConfirmation.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleResetOrder}
            data-testid="place-another-order-btn"
          >
            Place Another Order
          </button>
        </section>
      ) : (
        /* Checkout View */
        <div className="checkout-grid">
          {/* Left Column: Products & Cart */}
          <div className="cart-column">
            {/* Catalog Quick Add */}
            <div className="card catalog-section">
              <h2 className="card-title">Available Products</h2>
              <div className="catalog-grid">
                {PRODUCTS.map((prod) => {
                  const qty = getItemQuantity(prod.id);
                  return (
                    <div key={prod.id} className="product-card" data-testid={`catalog-${prod.id}`}>
                      <div>
                        <div className="product-name">{prod.name}</div>
                        <div className="product-desc">{prod.description}</div>
                      </div>
                      <div className="product-bottom">
                        <span className="product-price">${prod.price.toFixed(2)}</span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => addToCart(prod.id)}
                          data-testid={`add-to-cart-${prod.id}`}
                        >
                          + Add to Cart {qty > 0 ? `(${qty})` : ''}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shopping Cart List */}
            <div className="card cart-section">
              <h2 className="card-title">
                <span>Your Cart</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </h2>

              {/* Cart Level Validation Alert */}
              {errors.cart && (
                <div className="alert alert-danger" role="alert" data-testid="empty-cart-error">
                  <span className="alert-icon">⚠</span>
                  <div>{errors.cart}</div>
                </div>
              )}

              {cartEntries.length === 0 ? (
                <div className="empty-cart-state" data-testid="empty-cart-message">
                  <strong>Your cart is currently empty</strong>
                  <p>Add products from above to continue to checkout.</p>
                </div>
              ) : (
                <div className="cart-items" data-testid="cart-items-list">
                  {cartEntries.map(([id, qty]) => {
                    const product = PRODUCTS.find((p) => p.id === id);
                    if (!product) return null;
                    const lineTotal = product.price * qty;

                    return (
                      <div key={id} className="cart-item" data-testid={`cart-item-${id}`}>
                        <div className="cart-item-info">
                          <h4 data-testid={`item-name-${id}`}>{product.name}</h4>
                          <div className="cart-item-unit-price">
                            ${product.price.toFixed(2)} each
                          </div>
                        </div>

                        <div className="cart-item-actions">
                          {/* Quantity control */}
                          <div className="qty-control">
                            <button
                              type="button"
                              className="qty-btn"
                              aria-label={`Decrease ${product.name} quantity`}
                              onClick={() => updateQuantity(id, -1)}
                              data-testid={`decrement-qty-${id}`}
                            >
                              -
                            </button>
                            <span className="qty-value" data-testid={`qty-value-${id}`}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              className="qty-btn"
                              aria-label={`Increase ${product.name} quantity`}
                              onClick={() => updateQuantity(id, 1)}
                              data-testid={`increment-qty-${id}`}
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div
                            className="cart-item-line-total"
                            data-testid={`line-total-${id}`}
                          >
                            ${lineTotal.toFixed(2)}
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            className="btn btn-danger-outline"
                            onClick={() => removeItem(id)}
                            data-testid={`remove-item-${id}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cart Calculations Summary */}
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span data-testid="subtotal-amount">${orderTotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="summary-row total-row">
                  <span>Order Total</span>
                  <span data-testid="order-total-amount">${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Details & Checkout Form */}
          <div className="card checkout-form-column">
            <h2 className="card-title">Customer Information</h2>

            <form onSubmit={handlePlaceOrder} noValidate>
              {/* Required Full Name Field */}
              <div className="form-group">
                <label htmlFor="full-name" className="form-label">
                  Full Name <span className="required-mark">*</span>
                </label>
                <input
                  type="text"
                  id="full-name"
                  name="fullName"
                  className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  data-testid="customer-name-input"
                  disabled={isSubmitting}
                  autoComplete="name"
                />
                {errors.fullName && (
                  <div
                    className="field-error-text"
                    role="alert"
                    data-testid="name-validation-error"
                  >
                    <span>⚠</span> {errors.fullName}
                  </div>
                )}
              </div>

              {/* Optional Email Field (to demonstrate preserving non-erroneous data) */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="sarah@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  data-testid="customer-email-input"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              {/* Order Submission Button */}
              <button
                type="submit"
                className="btn btn-primary btn-place-order"
                disabled={isSubmitting}
                data-testid="place-order-button"
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" /> Processing Order...
                  </>
                ) : (
                  `Place Order • $${orderTotal.toFixed(2)}`
                )}
              </button>

              <p
                style={{
                  fontSize: '0.775rem',
                  color: '#94a3b8',
                  textAlign: 'center',
                  marginTop: '0.75rem',
                }}
              >
                Guaranteed safe checkout. No duplicate charges.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
