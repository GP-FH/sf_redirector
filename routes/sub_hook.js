/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * This route handles webhook events sent = from Chargebee. Current events
 * handled:
 *  - subscription_created
 *  - subscription_renewed
 *  - subscription_cancelled
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const express = require("express");

const slack = require( "../libs/lib_slack");
const autopilot = require( "../libs/lib_autopilot");
const order = require( "../libs/lib_order");
const product_plan = require( "../libs/lib_product_plan");
const logger = require("../libs/lib_logger");

const router = express.Router();

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
    const subscription = req.body.content.subscription;

    let ret = await product_plan.product_plan_is_one_off( subscription.plan_id );

    try {
      if ( ret.one_off ) {
        await autopilot.autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_E427B712-F86E-4864-80F5-C8C5AC335E17', customer.email );
        ret = await order.order_create_new_purchase( subscription, customer );
      }
      else {
        await autopilot.autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_1C4F1411-4376-4FEC-8B63-3ADA5FF4EBBD', customer.email );
        ret = await order.order_create_new_subscription( subscription, customer, coupons );
      }
    }
    catch ( err ) {
      next(err);
    }

    if ( process.env.ENVIRONMENT == 'prod' && ret.ok ) {
      slack.slack_send( 'subscription_created', customer, subscription );
    }
  }
  else if ( event_type == 'subscription_renewed' ) {
    /*
     * On subscription renewal check whether it's delivery time. If so,
     * create a sales order in TradewGecko. If not a delivery time, increment
     * the subscription count.
     */
    const subscription = req.body.content.subscription;
    const customer = req.body.content.customer;

    let ret;
    try {
      ret = await order.order_process_renewal( subscription, customer );
    }
    catch ( err ) {
      next(err);
    }

    //if ( process.env.ENVIRONMENT == 'prod' && ret.ok && ret.new_order) {
    if (ret.ok && ret.new_order) {
      slack.slack_send( 'subscription_renewed', customer, subscription );
    }
  }
  else if ( event_type == 'subscription_cancelled' ) {
    /*
     * For notifying in Slack when a subscription has been cancelled
     */
    const customer = req.body.content.customer;
    const subscription = req.body.content.subscription;

    if ( process.env.ENVIRONMENT == 'prod' ) {
      //  notify Slack
      slack.slack_send( 'subscription_cancelled', customer, subscription );
    }
  }
} );

// error handling for the sub route
router.use( function ( err, req, res, next ) {
  res.end();
  logger.error(err);
} );

module.exports = router;
