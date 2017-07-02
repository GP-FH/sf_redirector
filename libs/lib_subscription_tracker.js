/*
 *
 *  lib_subscription_tracker: this lib handles keeping track of the number of billing cycles completed per subscription.
 *  This is necessary as we bill monthly but only deliver quarterly, so we need a way to know when to generate a sales
 *  order.
 *
 *  This is accomplished using a redis hash with the customer_id as the hash, subscription_id as the field, and a count
 *  as the field value
 *
 */

var redis = require( 'redis' );
var logger = require( './lib_logger.js' );

/*
 *  creates count for customer with passed id
 */
exports.set = function ( customer_id, subscription_id ) {

    var client = redis.createClient();

    //  listen for errors
    client.on( 'error', function ( err ) {

        logger.error( 'Error with Redis: ' + err );
        client.quit();

    } );

    client.hset( customer_id, subscription_id, 2, function ( err, res ) {

        if ( err ) {

            logger.error( 'Error setting initial count for subscription - reason: ' + err + '. For customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
            client.quit();

        }

        client.quit();
    } );
};

/*
 *  increments counter for given customer_id - NOT USED REALLY
 */
exports.increment = function ( customer_id, subscription_id ) {

    var client = redis.createClient();

    //  listen for errors
    client.on( 'error', function ( err ) {

        logger.error( 'Error with Redis: ' + err );
        client.quit();

    } );

    client.hincrby( customer_id, subscription_id, 1 );
    client.quit();
};

/*
 *  increments counter for given customer_id and returns boolean indicating whether a new order is required
 */
exports.increment_and_check = function ( customer_id, subscription_id, callback ) {

    var client = redis.createClient();

    //  listen for errors
    client.on( 'error', function ( err ) {

        logger.error( 'Error with Redis: ' + err );
        client.quit();

    } );

    client.hincrby( customer_id, subscription_id, 1, function ( err, reply ) {

        if ( err ) {

            logger.error( 'Error incrementing count for subscription - reason: ' + err + '. For customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
            return callback( err );

        }

        logger.info( 'DEBUG: value post-increment' );

        //  if reply is 4, reset the counter to 1
        if ( reply == 4 ) {

            client.hset( customer_id, subscription_id, 1 );
            logger.info( 'Reset counter to 1 - no sales order required for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
            client.quit();
            return callback( null, false );

        } // if reply is 2 then a new sales order is required
        else if ( reply == 2 ) {

            logger.info( 'New sales order required for customer_id:' + customer_id + ' with subscription_id: ' + subscription_id );
            client.quit();
            return callback( null, true );

        }

        logger.info( 'Incremented count - no sales order required for customer_id: ' + customer_id + ' with subscription_id: ' + subscription_id );
        client.quit();
        return callback( null, false );
    } );
};
