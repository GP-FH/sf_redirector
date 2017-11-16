var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var chargebee = require( 'chargebee' );
chargebee.configure( {
    site: 'stitchfox-test',
    api_key: 'test_htql10oiHR3mKzcuH0QhjIVse2dcugghIf'
} );
var lib_chargebee = require( '../libs/lib_chargebee.js' );
var proxyquire = require( 'proxyquire' );

describe( 'Get customer information', () => {
    var tested_module, expected_response;
    before( function () {
        /*
         * Create dummy responses for stubs to use instead of actually calling the Chargebee API
         */

        expected_response = {
            ok: true,
            customer: {
                id: '123456',
                email: 'test@test.com'
            }
        };
        var expected_chargebee_response = {
            customer: {
                id: '123456',
                email: 'test@test.com'
            }
        };

        /*
         * Create stubs. These will replace the functionality of the chargebee module so that we are not depending on
         * calling the 3rd party during tests.
         */

        var request_stub = sinon.stub().yields( null, expected_chargebee_response );
        var retrieve_stub = sinon.stub().withArgs().returns( {
            request: request_stub
        } );
        var customer_stub = sinon.stub( chargebee, 'customer' ).returns( {
            retrieve: retrieve_stub
        } );

        /*
         * Use proxyquire to listen for the require() call to the chargebee module and replace it with the stubs we
         * created above.
         */

        tested_module = proxyquire( '../libs/lib_chargebee.js', {
            'chargebee': {
                customer: {
                    retrieve: retrieve_stub
                }
            }
        } );

    } );

    it( 'should return a standard ok:true object on successful retrieval', ( done ) => {
        tested_module.chargebee_get_customer_info( '123456' )
            .then( ( ret ) => {
                expect( ret ).to.deep.equal( expected_response );
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );

    it( 'should reject a non-valid parameter being passed to it with ok:false', ( done ) => {
        tested_module.chargebee_get_customer_info()
            .then( ( ret ) => {
                done( 'Function call with missing parameter should fail' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );
} );

describe( 'Get subscription information', () => {
    var tested_module, expected_response;
    before( function () {
        /*
         * Create dummy responses for stubs to use instead of actually calling the Chargebee API
         */

        expected_response = {
            ok: true,
            subscription: {
                id: '123456'
            }
        };
        var expected_chargebee_response = {
            subscription: {
                id: '123456'
            }
        };

        /*
         * Create stubs. These will replace the functionality of the chargebee module so that we are not depending on
         * calling the 3rd party during tests.
         */

        var request_stub = sinon.stub().yields( null, expected_chargebee_response );
        var retrieve_stub = sinon.stub().withArgs().returns( {
            request: request_stub
        } );
        var subscription_stub = sinon.stub( chargebee, 'subscription' ).returns( {
            retrieve: retrieve_stub
        } );

        /*
         * Use proxyquire to listen for the require() call to the chargebee module and replace it with the stubs we
         * created above.
         */

        tested_module = proxyquire( '../libs/lib_chargebee.js', {
            'chargebee': {
                subscription: {
                    retrieve: retrieve_stub
                }
            }
        } );

    } );

    it( 'should return a standard ok:true object on successful retrieval', ( done ) => {
        tested_module.chargebee_get_subscription_info( '123456' )
            .then( ( ret ) => {
                expect( ret ).to.deep.equal( expected_response );
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );

    it( 'should reject a non-valid parameter being passed to it with ok:false', ( done ) => {
        tested_module.chargebee_get_subscription_info()
            .then( ( ret ) => {
                done( 'Function call with missing parameter should fail' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );

} );
