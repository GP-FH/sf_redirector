var product_plans_one_offs = [ 'style-pack', 'style-chest', 'style-bomb' ];
var product_plans_subscriptions = [ 'premium-box', 'deluxe-box', 'premium-box-weekly', 'deluxe-box-weekly' ];

var product_plan_is_one_off = ( plan_id ) => {
    logger.info( 'DEBUG: HELLO BEFORE PROMISE' );
    return new Promise( ( resolve, reject ) => {
        logger.info( 'DEBUG: HELLO' );
        logger.info( 'DEBUG: product_plans_one_offs.include(plan_id) = ' + product_plans_one_offs.includes( plan_id ) );
        if ( product_plans_one_offs.includes( plan_id ) ) {
            logger.info( 'DEBUG: product plan: one_off = true' );
            return resolve( {
                ok: true,
                one_off: true
            } );
        }
        else {
            return reject( {
                ok: true,
                one_off: false
            } );
        }
    } );
};

exports.product_plan_is_one_off = product_plan_is_one_off;
