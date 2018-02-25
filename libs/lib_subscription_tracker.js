/*
 *
 *  lib_subscription_tracker: this lib handles keeping track of the number of billing cycles completed per subscription.
 *  This is necessary as we bill monthly & weekly but only deliver quarterly, so we need a way to know when to generate a sales
 *  order.
 *
 *  This is accomplished using a redis hash with the customer_id as the hash, subscription_id as the field, and a count
 *  as the field value
 *
 *  A bit about count ranges:
 *  In order to accurately keep track of weekly and monthly counts + provide a way to keep counts (and deliveries)
 *  consistent for customers that may switch payment frequency, monthly and weekly subs utilise different number ranges.
 *
 *  Monthly: 1-3 & weekly: 5-17
 *
 *  As change can only take effect on renewal (you can't immediately change from monthly to weekly or vice versa - the
 *  change only takes effect on next renewal), these differing ranges allow us to detect when someone has changed plans
 *  (their count range doesn't match their plan payment frequency) + it's easy to map the ranges to eachother.
 *
 */

const VError = require("verror");
const redis = require("redis");

const logger = require("./lib_logger");

/*
 *  creates count for customer with passed id on monthly plan. Includes test param which is set
 *  to true during (you guessed it) test run
 */
const set_monthly = ( customer_id, subscription_id, test = false ) => {
  if ( test ) {
    redis = require( 'redis-mock' );
  }

  const options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  };

  const client = redis.createClient( options );

  client.on( 'error', ( err ) => {
    client.quit();
    throw new VError({name:'redis', cause: err});
  } );

  client.hset( customer_id, subscription_id, 2);
  client.quit();
};

/*
 *  creates count for customer with passed id on weekly plan. Includes test param which is set to
 *  true during (you guessed it) test run
 */
const set_weekly = ( customer_id, subscription_id, test = false ) => {
  if ( test ) {
    redis = require( 'redis-mock' );
  }

  const options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  };

  const client = redis.createClient( options );

  //  listen for errors
  client.on( 'error', ( err ) => {
    client.quit();
    throw new VError({name:'redis', cause: err});
  } );

  client.hset( customer_id, subscription_id, 6);
  client.quit();
};

/*
 *  increments counter for given customer_id and returns boolean indicating whether a new order is required.
 *  Includes test param which is set to true during (you guessed it) test run
 */
const increment_and_check_monthly = async ( customer_id, subscription_id, plan_id, test = false ) => {
  if ( test ) {
    redis = require( 'redis-mock' );
  }

  const options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  };

  const client = redis.createClient( options );

  //  listen for errors
  client.on( 'error', ( err ) => {
    client.quit();
    throw new VError({name:'redis', cause: err});
  } );

  let increment;
  try {
    increment = await _validate_subscription_count( plan_id, customer_id, subscription_id );
  }
  catch(err) {
    throw new VError({name:'redis', cause: err}, "error validating subscription count");
  }

  let new_order = false;
  if ( increment ) {
    //  increment user count and decide whether to generate a Sales Order in Cin7
    client.hincrby( customer_id, subscription_id, 1, ( err, reply ) => {
      if ( err ) {
        throw new VError({name:'redis', cause: err});
      }

      //  if reply is 4, reset the counter to 1
      if ( reply == 4 ) {
        client.hset( customer_id, subscription_id, 1 );
        logger.info( 'Reset counter to 1 - no sales order required for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
        new_order = false;

      } // if reply is 2 then a new sales order is required
      else if ( reply == 2 ) {
        logger.info( 'New sales order required for customer_id:' + customer_id + ' with subscription_id: ' + subscription_id );
        new_order = true;
      }

      logger.info( 'Incremented count - no sales order required for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
      new_order = false;
    } );
  }

  client.quit();
  return new_order;
};

/*
 *  increments counter and checks if sales order is required for weekly subscribers.
 *  A sales order is requires every 13 weeks.
 */
const increment_and_check_weekly = async ( customer_id, subscription_id, plan_id, callback, test = false ) => {
  if ( test ) {
      redis = require( 'redis-mock' );
  }

  var options = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
  };

  var client = redis.createClient( options );

  //  listen for errors
  client.on( 'error', ( err ) => {
    client.quit();
    throw new VError({name:'redis', cause: err});
  } );

  let increment;
  try {
    increment = await _validate_subscription_count( plan_id, customer_id, subscription_id);
  }
  catch(err) {
    throw new VError({name:'redis', cause: err}, "error validating subscription count");
  }

  let new_order = false;
  if ( increment ) {
    //  increment user count and decide whether to generate a Sales Order in Cin7
    client.hincrby( customer_id, subscription_id, 1, ( err, reply ) => {
      if ( err ) {
        throw new VError({name:'redis', cause: err});
      }

      //  if reply is 18, reset the counter to 5
      if ( reply == 18 ) {
        client.hset( customer_id, subscription_id, 5 );
        logger.info( 'Reset counter to 5 - no sales order required for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
        new_order = false;
      } // if reply is 6 then a new sales order is required
      else if ( reply == 6 ) {
        logger.info( 'New sales order required for customer_id:' + customer_id + ' with subscription_id: ' + subscription_id );
        new_order = true;
      }

      logger.info( 'Incremented count - no sales order required for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
      client.quit();
      return new_order;
    } );
  }
};

/*
 *  this function is used to detect whether a customer has changed their plan from weekly to monthly (or vice versa).
 *  It looks at the plan id and verifies that they have the correct count range (monthly 1-3, weekly 5-17). If it detects
 *  that the count range does not match the plan_id this indicates the person has changed plans on renewal and the
 *  correct count is set.
 *
 *  Returns True indicating that the count is fine to increment. Currently no clear case for False but, ya know, wanted to
 *  give myself options.
 *
 */
async function _validate_subscription_count( plan_id, customer_id, subscription_id, test = false ) {
  if ( test ) {
    redis = require( 'redis-mock' );
  }

  const options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  };

  const client = redis.createClient( options );

  //  listen for errors
  client.on( 'error', ( err ) => {
    client.quit();
    throw new VError({name:'redis', cause: err});
  } );

  client.hget( customer_id, subscription_id, ( err, reply ) => {
    if ( err ) {
      throw new VError({name:'redis', cause: err});
    }

    let count_to_set = '0';

    //  means customer has changed to weekly plan on this renewal...
    if ( reply < 5 && ( plan_id == 'deluxe-box-weekly' || plan_id == 'premium-box-weekly' ) ) {
      /*
       *  map the current month to the last week in the monthly period and return true. This way the count
       *  will be incremented and the appropriate action taken
       */
      if ( reply == 1 ) {
        count_to_set = 5;
      }
      else if ( reply == 2 ) {
        count_to_set = 9;
      }
      else {
        count_to_set = 13;
      }

      client.hset( customer_id, subscription_id, count_to_set );

      return true;

    } // ... and vice versa
    else if ( reply > 4 && ( plan_id == 'deluxe-box' || plan_id == 'premium-box' ) ) {
      /*
       *  maps weekly ranges to monthly counts. This assumes manual handling of the switch is correct (seeing out
       *  weekly renewals for the rest of the current month and scheduling plan change on a renewal date the same
       *  as the plan creation date - (ugh))
       */
      if ( reply > 5 && reply < 10 ) {
        count_to_set = 2;
      }
      else if ( reply > 9 && reply < 14 ) {
        count_to_set = 3;
      }
      else {
        count_to_set = 1;
      }

      client.hset( customer_id, subscription_id, count_to_set );
      return true;

    }

    return true ;
  } );
}

/*
 * A glimpse into the future - a generic function for setting the sub count
 */
const subscription_tracker_set_subscription_count = async ( plan_id, subscription_id, customer_id ) => {
    switch ( plan_id ) {
      case 'deluxe-box':
      case 'premium-box':
        set_monthly( customer_id, subscription_id );
        break;
      case 'deluxe-box-weekly':
      case 'premium-box-weekly':
        set_weekly( customer_id, subscription_id );
        break;
      default:
        throw new VError ( "Unexpected plan_id received - cannot set subscription count" );
    }

    return;
};

exports.increment_and_check_monthly = increment_and_check_monthly;
exports.increment_and_check_weekly = increment_and_check_weekly;
exports.subscription_tracker_set_subscription_count = subscription_tracker_set_subscription_count;

exports.set_monthly = set_monthly; // These 2 are exported for test setup. This could be done better.
exports.set_monthly = set_monthly;
