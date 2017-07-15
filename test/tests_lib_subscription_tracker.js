/*
 *  Test suite for the subscription_tracker library.
 */

var expect = require( 'chai' ).expect;
var nock = require( 'nock' );
var sub_tracker = require( '../libs/lib_subscription_tracker.js' );

sub_tracker.set( 'test_id', 'test_sub', true );

describe( 'Set initial subscription number ', function () {

    it( 'first subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check( 'test_id', 'test_sub', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'second subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check( 'test_id', 'test_sub', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'third subscription renewal counted - new sales order', function ( done ) {
        sub_tracker.increment_and_check( 'test_id', 'test_sub', function ( err, ret ) {
            expect( ret ).to.be.true;
            done();
        }, true );

    } );

} );
