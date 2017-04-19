/*
 *
 *  subscription_counter.js: a hacky way of only generating sales orders on a quarterly basis (even though we charge monthly)
 *
 */

var redis = require( 'redis' );
var logger = require( './log_service.js' );



/*
 *  creates count for customer with passed id
 */
exports.set = function ( customer_id ) {

    var client = redis.createClient();

    //  listen for errors
    client.on( 'error', function ( err ) {
        logger.error( 'Error with Redis: ' + err );
    } );

    client.set( customer_id, 2, function ( err, res ) {

        if ( err ) {

            logger.error( 'Error setting initial count for subscription - reason: ' + error + '. For customer_id: ' + customer_id );
            client.quit();

        }

        client.quit();
    } );
};

/*
 *  increments counter for given customer_id
 */
exports.increment = function ( customer_id ) {

    var client = redis.createClient();

    //  listen for errors
    client.on( 'error', function ( err ) {
        logger.error( 'Error with Redis: ' + err );
    } );

    client.incr( customer_id );
    client.quit();
};

/*
 *  increments counter for given customer_id and returns boolean indicating whether a new order is required
 */
exports.increment_and_check = function ( customer_id, callback ) {

    var client = redis.createClient();

    //  listen for errors
    client.on( 'error', function ( err ) {
        logger.error( 'Error with Redis: ' + err );
    } );

    client.incr( customer_id, function ( err, reply ) {

        if ( err ) {

            logger.error( 'Error incrementing count for subscription - reason: ' + error + '. For customer_id: ' + customer_id );
            return callback( err );

        }

        //  if reply is 4, reset the counter to 1
        if ( reply == 4 ) {

            client.set( customer_id, 1 );
            logger.info( 'Reset counter to 1 - no sales order required for customer_id: ' + customer_id );
            client.quit();
            return callback( null, false );

        } // if reply is 2 then a new sales order is required
        else if ( reply == 2 ) {

            logger.info( 'New sales order required for customer_id:' + customer_id );
            client.quit();
            return callback( null, true );

        }

        logger.info( 'Incremented count - no sales order required for customer_id: ' + customer_id );
        client.quit();
        return callback( null, false );
    } );
};
