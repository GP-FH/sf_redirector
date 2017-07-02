# Stitchfox Redirector

## Overview

This sits between Typeform -> Cin7 -> Chargebee and allows us to provide a user subscription flow across all these products.

**The products**

- Typeform: nice form builder used to allow people to create their style profile
- Chargebee: subscription service. Manages recurring payments, subscription plans, and customers. Also provides customer portal.
- Cin7: inventory management system.

## How this works

### Subscription flow

- User selects plan in Squarespace
- Is bumped to Typeform to create profile
- On completion of form, user and their form data are redirected to redirect.wowzers.work (this)
- We request a pre-filled checkout page from Chargebee via their API (which creates a customer record in Chargebee by default using the info received from the Typeform form)
- On receiving the checkout URL, user is redirected to there to complete payment
- On completion Chargebee webhook fires off a `subscription_created` event. We hearing this we create a new customer record in Cin7 as well as a sales order - all via the Cin7 API + initiate a sales counter (more on that later)

### Renewals & updates

**As this is a monthly subscription, but we only ship every 3 months, this service also keeps track of when we should be sending stock to customers:**

Every month the Chargebee webhook fires off a `subscription_renewed` event which we listen for. On hearing this we check the sales counter for this customer. The sales counter is a number that is used to tell whether a customer is due a delivery. As we deliver on a 3 monthly basis it checks to see how many renewals have occurred since the last delivery. If the answer is 3 then it resets the counter and creates a new sales order in Cin7 for the customer. If it is something else then it just increments the counter and that's it.

**We provide a customer portal to users which allows them to modify address and CC details:**

While Chargebee is currently our customer source of truth, we also store customer info in Cin7 (so that we can send things to people). As a result if any changes occur to a customer record in Chargebee they need to be reflected in Cin7. To do this we listen for the `customer_changed` & `subscription_shipping_address_updated` Chargebee webhook events. These contain the new customer info. We then update the corresponding Cin7 customer record via the API. **It's important that we only ever update customer info IN CHARGEBEE**

### Archetype addition

### User mapping between Chargebee & Cin7

### Planned improvements

### Tracking stylist customer attribution

### Mixpanel event firing for funnel tracking
