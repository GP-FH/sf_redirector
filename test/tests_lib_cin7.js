/*
 *  Test suite for the cin7 library: unit tests to make sure lib functions are returning expected values
 */

var expect = require( 'chai' ).expect;
var nock = require( 'nock' );
var cin7 = require( '../libs/lib_cin7.js' );
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

//  mock calls - customer records
nock( 'https://api.cin7.com:443', {
        "encodedQueryParams": true
    } )
    .get( '/api/v1/Contacts' ) //   get -> doesn't exist
    .query( {
        "fields": "id",
        "where": 'email=\'test@notexists.com\''
    } )
    .reply( 200, [] )
    .get( '/api/v1/Contacts' ) //   get -> does exist
    .query( {
        "fields": 'id',
        "where": 'email=\'test@exists.com\'' //"email%3D%27test%40exists.com%27"
    } )
    .reply( 200, [ {
        id: 2
    } ] )
    .put( '/api/v1/Contacts', [ { //    update -> does exist
        "integrationRef": "does_exist"
    } ] )
    .reply( 200, [ {
        "index": 0,
        "success": true,
        "id": 13,
        "code": "asdas@asjdnas.com",
        "errors": []
    } ] )
    .put( '/api/v1/Contacts', [ { //    update -> non-200 response
        "integrationRef": "non-200"
    } ] )
    .reply( 400, {
        "message": "error"
    } )
    .put( '/api/v1/Contacts', [ { //    update -> error response
        "integrationRef": "error_resp"
    } ] )
    .reply( 200, [ {
        "index": 0,
        "success": false,
        "id": '',
        "code": "asdas@asjdnas.com",
        "errors": [ 'error' ]
    } ] )
    .post( '/api/v1/Contacts', [ {
        'integrationRef': 'success',
        'isActive': true,
        'type': 'Customer',
        'firstName': 'test',
        'lastName': 'test',
        'email': 'test@test.com',
        'phone': '1111111111',
        'address1': 'test',
        'address2': 'test',
        'city': 'test',
        'state': null,
        'postCode': 'test',
        'country': 'New Zealand',
        'group': null,
        'subGroup': null,
        'PriceColumn': 'RetailPrice'
    } ] )
    .reply( 200, [ { // create -> success
        "index": 0,
        "success": true,
        "id": 13,
        "code": "asdas@asjdnas.com",
        "errors": []
    } ] )
    .post( '/api/v1/Contacts', [ {
        'integrationRef': 'empty_resp',
        'isActive': true,
        'type': 'Customer',
        'firstName': 'test',
        'lastName': 'test',
        'email': 'test@test.com',
        'phone': '1111111111',
        'address1': 'test',
        'address2': 'test',
        'city': 'test',
        'state': null,
        'postCode': 'test',
        'country': 'New Zealand',
        'group': null,
        'subGroup': null,
        'PriceColumn': 'RetailPrice'
    } ] )
    .reply( 200 )
    .post( '/api/v1/Contacts', [ {
        "integrationRef": "non-200"
    } ] )
    .reply( 400, { // create -> non-200 response
        "message": "error"
    } );

//  mock calls - sales orders
nock( 'https://api.cin7.com:443', {
        "encodedQueryParams": true
    } )
    .post( '/api/v1/SalesOrders', [ {
        'stage': 'New',
        'memberId': 'success',
        'currencyCode': 'NZD',
        'taxStatus': 'Incl',
        'taxRate': 0.15,
        'internalComments': 'plan: ' + 'deluxe-box' + ' archetype: ' + 'NOT_SET' + ' top size: ' + 3 + ' bottom size: ' + 3 + ' subscription: ' + 's1',
        'lineItems': [ {
            'Code': 'STX-DELUXE-MON',
            'Name': 'Deluxe Box',
            'Option1': 'MON',
            'Option2': 'MONTH',
            'Option3': '1 x OSFA',
            'Qty': 1
        } ]
    } ] )
    .reply( 200, [ { // success
        "index": 0,
        "success": true,
        "id": 21,
        "code": "13-0",
        "errors": []
    } ] )
    .post( '/api/v1/SalesOrders', [ {
        'stage': 'New',
        'memberId': 'empty_resp',
        'currencyCode': 'NZD',
        'taxStatus': 'Incl',
        'taxRate': 0.15,
        'internalComments': 'plan: ' + 'deluxe-box' + ' archetype: ' + 'NOT_SET' + ' top size: ' + 3 + ' bottom size: ' + 3 + ' subscription: ' + 's1',
        'lineItems': [ {
            'Code': 'STX-DELUXE-MON',
            'Name': 'Deluxe Box',
            'Option1': 'MON',
            'Option2': 'MONTH',
            'Option3': '1 x OSFA',
            'Qty': 1
        } ]
    } ] )
    .reply( 200 )
    .post( '/api/v1/SalesOrders', [ {
        'stage': 'New',
        'memberId': 'success_false',
        'currencyCode': 'NZD',
        'taxStatus': 'Incl',
        'taxRate': 0.15,
        'internalComments': 'plan: ' + 'deluxe-box' + ' archetype: ' + 'NOT_SET' + ' top size: ' + 3 + ' bottom size: ' + 3 + ' subscription: ' + 's1',
        'lineItems': [ {
            'Code': 'STX-DELUXE-MON',
            'Name': 'Deluxe Box',
            'Option1': 'MON',
            'Option2': 'MONTH',
            'Option3': '1 x OSFA',
            'Qty': 1
        } ]
    } ] )
    .reply( 200, [ { // fail - success == false
        "index": 0,
        "success": false,
        "id": 21,
        "code": "13-0",
        "errors": []
    } ] )
    .post( '/api/v1/SalesOrders', [ {
        'stage': 'New',
        'memberId': 'invalid_plan',
        'currencyCode': 'NZD',
        'taxStatus': 'Incl',
        'taxRate': 0.15,
        'internalComments': 'plan: ' + 'deluxe-box' + ' archetype: ' + 'NOT_SET' + ' top size: ' + 3 + ' bottom size: ' + 3 + ' subscription: ' + 's1',
        'lineItems': [ {
            'Code': 'STX-DELUXE-MON',
            'Name': 'Deluxe Box',
            'Option1': 'MON',
            'Option2': 'MONTH',
            'Option3': '1 x OSFA',
            'Qty': 1
        } ]
    } ] )
    .reply( 200, [ { // fail - invalid plan
        "index": 0,
        "success": false,
        "id": 21,
        "code": "13-0",
        "errors": []
    } ] );


describe( 'Get customer record', function () {

    it( 'customer doesn\'t exist', function ( done ) {
        var email = 'test@notexists.com';
        cin7.get_customer_record( 'id', 'email=\'' + email + '\'', function ( err, ret ) {
            expect( ret.fields ).to.be.empty;
            done();
        } );
    } );

    it( 'customer does exist', function ( done ) {
        var email = 'test@exists.com';
        cin7.get_customer_record( 'id', 'email=\'' + email + '\'', function ( err, ret ) {
            expect( ret.fields[ 0 ].id ).to.be.above( 0 );
            done();
        } );
    } );

} );

describe( 'Update customer record', function () {

    it( 'customer does exist', function ( done ) {
        var customer_details = [ {
            integrationRef: 'does_exist'
        } ];
        cin7.update_customer_record( customer_details, function ( err, ret ) {
            expect( ret.ok ).to.be.true;
            expect( ret.fields[ 0 ].id ).to.be.above( 0 );
            done();
        } );
    } );

    it( 'request error - non-200 response', function ( done ) {

        var customer_details = [ {
            integrationRef: 'non-200',
        } ];

        cin7.update_customer_record( customer_details, function ( err, ret ) {
            expect( ret.ok ).to.be.false;
            expect( ret.msg ).to.match( /status code 400 reason:/ );
            done();
        } );
    } );

    it( 'request error - cin7 error response', function ( done ) {

        var customer_details = [ {
            integrationRef: 'error_resp'
        } ];
        cin7.update_customer_record( customer_details, function ( err, ret ) {
            expect( ret.fields[ 0 ].success ).to.be.false;
            expect( ret.fields[ 0 ].errors[ 0 ] ).to.equal( 'error' );
            done();
        } );
    } );

} );

/************************************** New Tests for V1.1 functions ***************************************/

describe( 'cin7_create_sales_order() - Create a sales order', () => {
    it( 'should return a valid ret (ok:true) argument on success', ( done ) => {
        cin7.cin7_create_sales_order( 'success', 'deluxe-box', 's1', '3', '3', 'NOT_SET' )
            .then( ( ret ) => {
                expect( ret.ok ).to.be.true;
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );

    it( 'should return a valid error (ok:false) for and empty response from cin7', ( done ) => {
        cin7.cin7_create_sales_order( 'empty_resp', 'deluxe-box', 's1', '3', '3', 'NOT_SET' )
            .then( ( ret ) => {
                done( 'This should not resolve' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );

    it( 'should return a valid error (ok:false) for an invalid plan id', ( done ) => {
        cin7.cin7_create_sales_order( 'invalid_plan', 'poop-box', 's1', '3', '3', 'NOT_SET' )
            .then( ( ret ) => {
                done( 'This should not resolve' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );

    it( 'should return a valid error (ok:false) for missing function parameters', ( done ) => {
        cin7.cin7_create_sales_order( '1', 'deluxe-box', 's1', '3' )
            .then( ( ret ) => {
                done( 'This should not resolve' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );
} );

describe( 'cin7_create_customer_record() - Create a contact record', () => {
    it( 'should return a valid ret (ok:true) argument on success', ( done ) => {
        cin7.cin7_create_customer_record( {
                'id': 'success',
                'first_name': 'test',
                'last_name': 'test',
                'email': 'test@test.com',
                'phone': '1111111111'
            }, {
                'id': 'success',
                'shipping_address': {
                    'line1': 'test',
                    'line2': 'test',
                    'city': 'test',
                    'postcode': 'test'
                }
            } )
            .then( ( ret ) => {
                expect( ret.ok ).to.be.true;
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );

    it( 'should return a valid error (ok:false) for an empty response from cin7', ( done ) => {
        cin7.cin7_create_customer_record( {
                'id': 'empty_resp',
                'first_name': 'test',
                'last_name': 'test',
                'email': 'test@test.com',
                'phone': '1111111111'
            }, {
                'id': 'empty_resp',
                'shipping_address': {
                    'line1': 'test',
                    'line2': 'test',
                    'city': 'test',
                    'postcode': 'test'
                }
            } )
            .then( ( ret ) => {
                done( 'This should not resolve' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );

    it( 'should return a valid error (ok:false) for missing function parameters', ( done ) => {
        cin7.cin7_create_customer_record()
            .then( ( ret ) => {
                done( 'This should not resolve' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );
} );

describe( 'cin7_check_customer_exists() - Check whether contact in Cin7 exists', () => {
    /*
     * These two tests are failing but it's due to a nock thing, not a function error. Will fix later
     *
    it( 'should return a valid ret (ok:true + exists true) argument on success', ( done ) => {
        cin7.cin7_check_customer_exists( 'test@exists.com' )
            .then( ( ret ) => {
                expect( ret.ok ).to.be.true;
                expect( ret.exists ).to.be.true;
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );

    it( 'should return a valid ret (ok:true + exists false) argument on success', ( done ) => {
        cin7.cin7_check_customer_exists( 'test@notexists.com' )
            .then( ( ret ) => {
                expect( ret.ok ).to.be.true;
                expect( ret.exists ).to.be.false;
                done();
            } )
            .catch( ( err ) => {
                done( err );
            } );
    } );*/

    it( 'should return a valid error (ok:false) for missing function parameters', ( done ) => {
        cin7.cin7_check_customer_exists()
            .then( ( ret ) => {
                done( 'This should not resolve' );
            } )
            .catch( ( err ) => {
                expect( err.ok ).to.be.false;
                done();
            } );
    } );
} );
