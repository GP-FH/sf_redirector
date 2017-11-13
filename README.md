# Stitchfox Redirector

## Overview

The redirector repo is all of the code that we have had to write to tie all of the products we use together. Over time we hope to relieve ourselves of some of this stuff (see typeform) and refine and improve what exists.

**The products**

- Typeform: nice form builder used to allow people to create their style profile
- Chargebee: subscription service. Manages recurring payments, subscription plans, and customers. Also provides customer portal.
- Cin7: inventory management system.
- Autopilot: marketing automation - mailing, journeys etc
- Mixpanel: web metrics and analytics

## Features

### Subscription flow

- User selects plan in Squarespace
- Is bumped to Typeform to create profile
- On completion of form, user and their form data are redirected to redirect.wowzers.work (this)
- We request a pre-filled checkout page from Chargebee via their API (which creates a customer record in Chargebee by default using the info received from the Typeform form)
- On receiving the checkout URL, user is redirected to there to complete payment
- On completion Chargebee webhook fires off a `subscription_created` event. We hearing this we create a new customer record in Cin7 as well as a sales order - all via the Cin7 API + initiate a sales counter (more on that later)

### Renewals & updates

**As this is a monthly/weekly subscription, but we only ship every 3 months, this service also keeps track of when we should be sending stock to customers:**

Every month/week the Chargebee webhook fires off a `subscription_renewed` event which we listen for. On hearing this we check the sales counter for this customer. The sales counter is a number that is used to tell whether a customer is due a delivery. As we deliver on a 3 monthly basis it checks to see how many renewals have occurred since the last delivery.

**We provide a customer portal to users which allows them to modify address and CC details:**

While Chargebee is currently our customer source of truth, we also store customer info in Cin7 (so that we can send things to people). As a result if any changes occur to a customer record in Chargebee they need to be reflected in Cin7. To do this we listen for the `customer_changed` & `subscription_shipping_address_updated` Chargebee webhook events. These contain the new customer info. We then update the corresponding Cin7 customer record via the API. **It's important that we only ever update customer info IN CHARGEBEE**

### User mapping between Chargebee & Cin7

Currently due to the way we create subscriptions (via hosted checkout pages) a new customer is created in chargebee for every subscription. This isn't quite what we want as it can result in multiple customer records for people who sign up more than once. We map accounts in chargebee to accounts in cin7 using email. Cin7 doesn't allow multiple customer records with the same email so while there may be multiple customer records for a single email in chargebee, they will only ever map to a single account in cin7.

### Tracking stylist customer attribution

We have arrangements with stylists who get paid for sending people to our site who convert. To track this we include a `campaign` query parameter on customer creation. Each stylist has a unique campaign code which is stored in the `stylist_campaigns` array in `profile_hook.js`. We check this and add it to the customer details if present. This allows us to track customer records and who they are attributed to. If you need to add more codes, just add them to this array + this spreadsheet: https://docs.google.com/spreadsheets/u/1/d/1_wy0Y-SMC0yxFeZQYPaaHdOJ3D4zJJMDUpFnhkGbOe0/edit#gid=0

### Mixpanel event firing for funnel tracking

To accurately track people moving through our subscription creation flow we fire a `profile_form_complete` event to mixpanel when we receive the initial request to `/profile_hook`. This allows us to create a funnel in mixpanel and see where people are dropping off. If you wish to add more events/edit the event name, just edit the config file.

### Needed improvements

- `sub_hook.js` is a fucking mess.  Needs a major refactor. This file should only handle moving requests around, but currently it does way too much heavy lifting.
- create a `lib_order.js` module. This can contain the logic for managing new subs, renewals etc.
- user per route error handling.
- create standard return format for all `lib_*.js` functions. Currently all over the place.
- using zapier for autopilot makes no sense and results in incomplete data making it into autopilot profiles. We can handle this much better: details in Slack - https://stitchfox.slack.com/archives/C4AAT050A/p1503763459000009
- tests need a proper rewrite. Should focus on function inputs and outputs from the perspective of the calling party. got stuck testing 3rd party calls which is dumb in this case
