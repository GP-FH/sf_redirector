var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var chargebee = require( 'chargebee' );
var lib_chargebee_coupon = require( '../libs/lib_chargebee_coupon.js' );
var proxyquire = require( 'proxyquire' );

describe( 'chargebee_coupon_create_new() - Create new coupon', () => {
    var tested_module, expected_response;
    before( function () {
        /*
         * Create dummy responses for stubs to use instead of actually calling the Chargebee API
         */

        expected_response = {
            ok: true
        };
        var expected_chargebee_response = {
            coupon_code: {
                id: '123456'
            }
        };

        /*
         * Create stubs. These will replace the functionality of the chargebee module so that we are not depending on
         * calling the 3rd party during tests.
         */

        var request_stub = sinon.stub().yields( null, expected_chargebee_response );
        var create_stub = sinon.stub().withArgs().returns( {
            request: request_stub
        } );

        /*
         * Use proxyquire to listen for the require() call to the chargebee module and replace it with the stubs we
         * created above.
         */

        tested_module = proxyquire( '../libs/lib_chargebee_coupon.js', {
            'chargebee': {
                coupon_code: {
                    create: create_stub
                }
            }
        } );

    } );

    it( 'should return a standard ok:true object on successful creation', ( done ) => {
        tested_module.chargebee_coupon_create_new( '123456', 'coupon_set', 'c123456' )
            .then( ( ret ) => {
                expect( ret ).to.deep.equal( expected_response );
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );

    it( 'should reject a non-valid parameter being passed to it with ok:false', ( done ) => {
        tested_module.chargebee_coupon_create_new( '123456', 'coupon_set' )
            .then( ( ret ) => {
                done( 'Function call with missing parameter should fail' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );
} );

describe( 'chargebee_coupon_check_and_apply_referral() - Check for and apply referral code credits', () => {
    var tested_module, expected_response;
    before( function () {
        /*
         * Create dummy responses for stubs to use instead of actually calling the Chargebee API
         */

        expected_response = {
            ok: true
        };
        var expected_chargebee_response = {
            customer: {
                id: '123456'
            }
        };

        /*
         * Create stubs. These will replace the functionality of the chargebee module so that we are not depending on
         * calling the 3rd party during tests.
         */

        var request_stub = sinon.stub().yields( null, expected_chargebee_response );
        var add_promotional_credits_stub = sinon.stub().withArgs().returns( {
            request: request_stub
        } );

        /*
         * Use proxyquire to listen for the require() call to the chargebee module and replace it with the stubs we
         * created above.
         */

        tested_module = proxyquire( '../libs/lib_chargebee_coupon.js', {
            'chargebee': {
                customer: {
                    add_promotional_credits: add_promotional_credits_stub
                }
            }
        } );

    } );

    it( 'should return a standard ok:true object on successful creation', ( done ) => {
        tested_module.chargebee_coupon_check_and_apply_referral( 'e123456' )
            .then( ( ret ) => {
                expect( ret ).to.deep.equal( expected_response );
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );

    it( 'should reject a non-valid parameter being passed to it with ok:false', ( done ) => {
        tested_module.chargebee_coupon_check_and_apply_referral()
            .then( ( ret ) => {
                done( 'Function call with missing parameter should fail' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );
} );
