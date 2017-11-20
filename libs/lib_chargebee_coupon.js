var chargebee = require( 'chargebee' );
chargebee.configure( {
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_API_KEY
} );

var chargebee_coupon_create_new = ( coupon_id, set_name, customer_id ) => {
    return new Promise( ( resolve, reject ) => {
        if ( coupon_id === undefined, set_name === undefined, customer_id === undefined ) {
            return reject( {
                ok: false,
                err_msg: 'Required parameter is undefined.',
                meta: {
                    coupon_id: coupon_id,
                    set_name: set_name,
                    customer_id: customer_id,
                    function: 'chargebee_coupon_create_new()'
                }
            } );
        }

        chargebee.coupon_code.create( {
            coupon_id: coupon_id,
            coupon_set_name: set_name,
            code: customer_id
        } ).request( ( err, ret ) => {
            if ( err ) {
                return reject( {
                    ok: false,
                    err_msg: err,
                    meta: {
                        customer_id: customer.id,
                        coupon_id: coupon_id,
                        set_name: set_name,
                        function: 'chargebee_coupon_create_new()'
                    }
                } );
            }

            resolve( {
                ok: true
            } );
        } );
    } );
};

var chargebee_coupon_check_and_apply_referral = ( entity_id ) => {
    return new Promise( ( resolve, reject ) => {
        if ( entity_id === undefined ) {
            return reject( {
                ok: false,
                err_msg: 'Required parameter is undefined.',
                meta: {
                    entity_id: entity_id,
                    function: 'chargebee_coupon_check_and_apply_referral()'
                }
            } );
        }

        if ( entity_id == process.env.FRIEND_REFERRAL_CODE_ID ) {
            var coupon_owner = coupons[ 0 ].description.split( ' ' )[ 0 ];

            chargebee.customer.add_promotional_credits( coupon_owner, {
                amount: 1000,
                description: "refer_a_friend credits"
            } ).request( ( err, ret ) => {
                if ( err ) {
                    return reject( {
                        ok: false,
                        err_msg: err,
                        meta: {
                            entity_id: entity_id,
                            function: 'chargebee_coupon_check_and_apply_referral()'
                        }
                    } );
                }

                return resolve( {
                    ok: true
                } );
            } );
        }

        return resolve( {
            ok: true
        } );
    } );
};

exports.chargebee_coupon_create_new = chargebee_coupon_create_new;
exports.chargebee_coupon_check_and_apply_referral = chargebee_coupon_check_and_apply_referral;
