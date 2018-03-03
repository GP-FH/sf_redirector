# Stitchfox Redirector

## Overview

The redirector repo is all of the code that we have had to write to tie all of the products we use together. Over time we hope to relieve ourselves of some of this stuff (see typeform) and refine and improve what exists.

**The products**

- Typeform: nice form builder used to allow people to create their style profile
- Chargebee: subscription service. Manages recurring payments, subscription plans, and customers. Also provides customer portal.
- TradeGecko: inventory management system.
- Autopilot: marketing automation - mailing, journeys etc
- Mixpanel: web metrics and analytics
- Slack: Where Work Happens

## Features

### Subscription flow

- User selects plan in Squarespace
- Is bumped to Typeform to create profile
- On completion of form, user and their form data are redirected to redirect.wowzers.work (this)
- We request a pre-filled checkout page from Chargebee via their API (which creates a customer record in Chargebee by default using the info received from the Typeform form)
- On receiving the checkout URL, user is redirected to there to complete payment
- On completion Chargebee webhook fires off a `subscription_created` event. On hearing this we create a new new 'draft' sales order (which automatically adds a new address to the `Stylist` relationship) in TradeGecko (acting as a 'job' for stylists)+ initiate a sales counter (more on that later)

### Renewals & updates

**As this is a monthly/weekly subscription, but we only ship every 3 months, this service also keeps track of when we should be sending stock to customers:**

Every month/week the Chargebee webhook fires off a `subscription_renewed` event which we listen for. On hearing this we check the sales counter for this customer. The sales counter is a number that is used to tell whether a customer is due a delivery. As we deliver on a 3 monthly basis it checks to see how many renewals have occurred since the last delivery.

### User mapping in Chargebee & data storage in general

**Chargebee is the source of truth for customer information.** Currently due to the way we create subscriptions (via hosted checkout pages) a new customer is created in Chargebee for every subscription. This isn't quite what we want as it can result in multiple customer records for people who sign up more than once but is OK for the minute.

### Tracking stylist customer attribution

We have arrangements with stylists who get paid for sending people to our site who convert. To track this we include a `campaign` query parameter on customer creation. Each stylist has a unique campaign code which is stored in the `stylist_campaigns` array in `profile_hook.js`. We check this and add it to the customer details if present. This allows us to track customer records and who they are attributed to. If you need to add more codes, just add them to this array + this spreadsheet: https://docs.google.com/spreadsheets/u/1/d/1_wy0Y-SMC0yxFeZQYPaaHdOJ3D4zJJMDUpFnhkGbOe0/edit#gid=0

### Mixpanel event firing for funnel tracking

To accurately track people moving through our subscription creation flow we fire a `profile_form_complete` event to mixpanel when we receive the initial request to `/profile_hook`. This allows us to create a funnel in mixpanel and see where people are dropping off. If you wish to add more events/edit the event name, just edit the config file.

### Needed improvements
- cron to tidy up duplicate addresses attached to the `Stylist` relationship in TradeGecko
- move stylist attribution into it's own lib
- cron to renew SSL certs in dev and prod
- create standard return format for all `lib_*.js` functions. Currently all over the place.
- using zapier for autopilot makes no sense and results in incomplete data making it into autopilot profiles. We can handle this much better: details in Slack - https://stitchfox.slack.com/archives/C4AAT050A/p1503763459000009
- tests need a proper rewrite. Should focus on function inputs and outputs from the perspective of the calling party. got stuck testing 3rd party calls which is dumb in this case
- proper queueing system for calls to third party APIs with retry strategies
- perf instrumentation via middleware
- general request logs via middleware
- verification token checks via middleware
- add load balancer and terminate ssl there. this will provide flexibility to swap servers in and out
- use API images for new boxes - not complicated runbooks
