/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * This route handles webhook events sent = from Chargebee. Current events
 * handled:
 *  - subscription_created
 *  - subscription_renewed
 *  - subscription_cancelled
 *  - payment_failed
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const express = require("express");

const slack = require( "../libs/lib_slack");
const autopilot = require( "../libs/lib_autopilot");
const order = require( "../libs/lib_order");
const product_plan = require( "../libs/lib_product_plan");
const logger = require("../libs/lib_logger");
const chargebee = require("../libs/lib_chargebee");
const db = require("../libs/lib_db");

// router level middleware
const token_check = require("../middleware/mw_verification_token_check").verification_token_check;
const router = express.Router();
router.use(token_check);

router.post( '/', async ( req, res, next ) => {
  res.status( 200 ).send();

  const event_type = req.body.event_type;

  if ( event_type == 'subscription_created' ) {
    /*
     * On subscription creation, a new customer and a new sales order is
     * created in TradeGecko
     */

    const customer = req.body.content.customer;
    const coupons = req.body.content.invoice.discounts || false;
    let subscription = req.body.content.subscription;

    /*
     * Check if customer is new or existing. If existing then we need to retrieve the
     * the customer's style profile information from aux db
     */

    const new_customer = await order.order_validate_if_for_new_customer(subscription);

    if (!new_customer){
      const profile = await db.db_aux_retrieve_most_recent_style_profile(customer.email);

      if (!profile.subscription){
        logger.error(
          `Style profile information not found in aux db for subscription with id: ${subscription.id}. This means we likely need to head into typeform
           and track it down and add it to the sub in chargebee. Because it is missing.`
        );
      }else {
        const updated_sub = await chargebee.chargebee_update_subscription(subscription, profile.subscription);
        subscription = updated_sub.subscription;
      }
    }

    let ret = await product_plan.product_plan_is_one_off( subscription.plan_id );

    try {
      if ( ret.one_off ) {
        await autopilot.autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_E427B712-F86E-4864-80F5-C8C5AC335E17', customer.email );
        ret = await order.order_create_new_purchase( subscription, customer );
      }
      else {
        await autopilot.autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_1C4F1411-4376-4FEC-8B63-3ADA5FF4EBBD', customer.email );
        ret = await order.order_create_new_subscription( subscription, customer, coupons, new_customer );
      }
    }
    catch ( err ) {
      next(err);
    }

    if ( process.env.ENVIRONMENT == 'prod' && ret.ok ) {
      slack.slack_send( 'subscription_created', customer, subscription );
    }
  }
  else if (event_type == 'subscription_renewed') {
    /*
     * On subscription renewal check whether it's delivery time. If so,
     * create a sales order in TradewGecko. If not a delivery time, increment
     * the subscription count.
     */

    const subscription = req.body.content.subscription;
    const customer = req.body.content.customer;
    const invoice = req.body.content.invoice;

    let ret;
    try{
      /*
       * COMMENTED OUT WHILE WE FIGURE OUT HOW TO HANDLE THESE UNPAID SUBS PROPERLY
       */
      //if (invoice.status != 'not_paid'){
        ret = await order.order_process_renewal( subscription, customer );
      //}
    }
    catch (err){
      next(err);
    }

    if ( process.env.ENVIRONMENT == 'prod' && ret.ok && ret.new_order) {
      slack.slack_send( 'subscription_renewed_new_order', customer, subscription );
    }
  }
  else if (event_type == 'subscription_cancelled') {
    /*
     * For notifying in Slack when a subscription has been cancelled
     */

    const customer = req.body.content.customer;
    const subscription = req.body.content.subscription;

    if ( process.env.ENVIRONMENT == 'prod' ) {
      slack.slack_send( 'subscription_cancelled', customer, subscription );
    }
  }
  else if (event_type == 'payment_failed'){
    const invoice = req.body.content.invoice;
    const subscription = req.body.content.subscription;
    const customer = req.body.content.customer;

    /*
     * If the status is not_paid it indicates that they have been through dunning and
     * still not paid. Time has come to pause their subscription and send an alert to
     * Slack
     */

    /* COMMENTED OUT WHILE WE FIGURE OUT HOW TO HANDLE THESE UNPAID SUBS PROPERLY

    if (invoice.status == 'not_paid'){
      try{
        await chargebee.chargebee_pause_subscription(subscription.id);

        if (process.env.ENVIRONMENT == 'prod'){
          slack.slack_send( 'subscription_paused', customer, subscription );
        }
      }
      catch (err){
        next(err);
      }

    }*/
  }
} );

// error handling for the sub route
router.use( ( err, req, res, next ) => {
  res.end();
  logger.error(err);
} );

module.exports = router;
