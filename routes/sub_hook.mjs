/*
 *
 * This route handles webhook events sent from Chargebee. Current events
 * handled:
 *  - subscription_created
 *  - subscription_renewed
 *
 */

import * as express from "express";
import * as request from "request";
import * as util from "underscore";

import { slack_send } from "../libs/lib_slack";
import { autopilot_move_contact_to_new_list } from "../libs/lib_autopilot";
import { order_create_new_purchase, order_create_new_subscription, order_process_renewal } from "../libs/lib_order";
import { product_plan_is_one_off } from "../libs/lib_product_plan";

const logger = require("../libs/lib_logger");

const router = express.Router();

router.post( '/', async ( req, res, next ) => {
  res.status( 200 ).send();

  const event_type = req.body.event_type;

  if ( event_type == 'subscription_created' ) {
    /*
     * On subscription creation, a new customer and a new sales order is
     * created in Cin7
     */

    const customer = req.body.content.customer;
    const coupons = req.body.content.invoice.discounts || false;
    const subscription = req.body.content.subscription;

    let ret = await product_plan_is_one_off( subscription.plan_id );

    try {
      if ( ret.one_off ) {
        await autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_E427B712-F86E-4864-80F5-C8C5AC335E17', customer.email );
        ret = await order_create_new_purchase( subscription );
      }
      else {
        await autopilot_move_contact_to_new_list( 'contactlist_AAB1C098-225D-48B7-9FBA-0C4A68779072', 'contactlist_1C4F1411-4376-4FEC-8B63-3ADA5FF4EBBD', customer.email );
        ret = await order_create_new_subscription( subscription, coupons );
      }
    }
    catch ( err ) {
      next(err);
    }

    if ( process.env.ENVIRONMENT == 'prod' && ret.ok ) {
      slack_send( 'subscription_created', customer, subscription );
    }
  }
  else if ( event_type == 'subscription_renewed' ) {
    /*
     * On subscription renewal check whether it's delivery time. If so,
     * create a sales order in cin7. If not a delivery time, increment
     * the subscription count.
     */

    const subscription = req.body.content.subscription;
    const customer = req.body.content.customer;

    try {
      let ret = await order_process_renewal(subscription);
    }
    catch ( err ) {
      // handle error
    }

    if ( process.env.ENVIRONMENT == 'prod' && ret.ok ) {
      slack_send( 'subscription_renewed', customer, subscription );
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
      slack_notifier.slack_send( 'subscription_cancelled', customer, subscription );
    }

  }
} );

// error handling for the sub route
router.use( function ( err, req, res, next ) {
  res.end();
  logger.error( JSON.stringify( err ) );
} );

module.exports = router;
