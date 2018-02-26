/*
 *  Test suite for the subscription_tracker library.
 */

const expect = require( 'chai' ).expect;
const sub_tracker = require( '../libs/lib_subscription_tracker.mjs' );

sub_tracker.set_weekly( 'test_id_weekly', 'test_sub_id_weekly', true );
sub_tracker.set_monthly( 'test_id_monthly', 'test_sub_id', true );
sub_tracker.set_monthly( 'test_id_switch', 'test_sub_id_switch', true );
sub_tracker.set_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', true );

describe( 'Subscription created to first renewal - monthly ', function () {

    it( '1st subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '2nd subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '3rd subscription renewal counted - new sales order', function ( done ) {
        sub_tracker.increment_and_check_monthly( 'test_id_monthly', 'test_sub_id', 'deluxe-box', function ( err, ret ) {
            expect( ret ).to.be.true;
            done();
        }, true );

    } );

} );

describe( 'Subscription created to first renewal - weekly ', function () {

    it( '1st subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '2nd subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '3rd subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '4th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '5th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '6th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '7th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '8th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '9th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '10th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '11th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '12th subscription renewal counted', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( '13th subscription renewal counted - new sales order created', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_weekly', 'test_sub_id_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.true;
            done();
        }, true );

    } );

} );

describe( 'Subscription changed from monthly to weekly on renewal changes count to weekly range ', function () {

    it( 'increment count to 10 and return false', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 11 and return false', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 12 and return false ', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 13 and return false ', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 14 and return false ', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 15 and return false ', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 16 and return false ', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 17 and return false ', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'reset count to 5 and return false ', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 6 and return true - new sales order created', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch', 'test_sub_id_switch', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.true;
            done();
        }, true );

    } );

} );

describe( 'Subscription changed from weekly to monthly on renewal changes count to monthly range ', function () {

    it( 'increment count to 7 and return false', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 8 and return false', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );


    it( 'increment count to 9 and return false', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'deluxe-box-weekly', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );


    it( 'plan change and set count to 2 and return false', function ( done ) {
        sub_tracker.increment_and_check_weekly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'premium-box', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );


    it( 'increment count to 1 and return true and return false', function ( done ) {
        sub_tracker.increment_and_check_monthly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'premium-box', function ( err, ret ) {
            expect( ret ).to.be.false;
            done();
        }, true );

    } );

    it( 'increment count to 2  - new sales order created', function ( done ) {
        sub_tracker.increment_and_check_monthly( 'test_id_switch_weekly', 'test_sub_id_switch_weekly', 'premium-box', function ( err, ret ) {
            expect( ret ).to.be.true;
            done();
        }, true );

    } );

} );
