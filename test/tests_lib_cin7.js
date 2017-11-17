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
        "where": "email%3D%27test%40notexists.com%27"
    } )
    .reply( 200, [] )
    .get( '/api/v1/Contacts' ) //   get -> does exist
    .query( {
        "fields": "id",
        "where": "email%3D%27test%40exists.com%27"
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
        "integrationRef": "success"
    } ] )
    .reply( 200, [ { // create -> success
        "index": 0,
        "success": true,
        "id": 13,
        "code": "asdas@asjdnas.com",
        "errors": []
    } ] )
    .post( '/api/v1/Contacts', [ {
        "integrationRef": "error_resp"
    } ] )
    .reply( 200, [ { // create -> error response
        "index": 0,
        "success": false,
        "id": null,
        "code": null,
        "errors": [
            "error"
        ]
    } ] )
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
        'member_id': 'win',
        'plan_id': 'deluxe-box',
        'subscription_id': 's1',
        'size_top': '3',
        'size_bottom': '3',
        'archetype': 'NOT_SET'
    } ] )
    .reply( 200, [ { // success
        "index": 0,
        "success": true,
        "id": 21,
        "code": "13-0",
        "errors": []
    } ] )
    .post( '/api/v1/SalesOrders', [ {
        'member_id': 'empty_resp',
        'plan_id': 'deluxe-box',
        'subscription_id': 's1',
        'size_top': '3',
        'size_bottom': '3',
        'archetype': 'NOT_SET'
    } ] )
    .reply( 200, [ { // fail - empty response
    } ] )
    .post( '/api/v1/SalesOrders', [ {
        'member_id': 'success_false',
        'plan_id': 'deluxe-box',
        'subscription_id': 's1',
        'size_top': '3',
        'size_bottom': '3',
        'archetype': 'NOT_SET'
    } ] )
    .reply( 200, [ { // fail - success == false
        "index": 0,
        "success": false,
        "id": 21,
        "code": "13-0",
        "errors": []
    } ] )
    .post( '/api/v1/SalesOrders', [ {
        'member_id': 'invalid_plan',
        'plan_id': 'poop_box',
        'subscription_id': 's1',
        'size_top': '3',
        'size_bottom': '3',
        'archetype': 'NOT_SET'
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

describe( 'Create customer record', function () {

    it( 'successful customer creation', function ( done ) {
        var customer_details = [ {
            integrationRef: 'success'
        } ];
        cin7.create_customer_record( customer_details, function ( err, ret ) {
            expect( ret.ok ).to.be.true;
            expect( ret.fields[ 0 ].id ).to.be.above( 0 );
            done();
        } );
    } );

    it( 'request error - non-200 response', function ( done ) {

        var customer_details = [ {
            integrationRef: 'non-200',
        } ];

        cin7.create_customer_record( customer_details, function ( err, ret ) {
            expect( ret.ok ).to.be.false;
            expect( ret.msg ).to.match( /status code 400 reason:/ );
            done();
        } );
    } );

    it( 'request error - cin7 error response', function ( done ) {

        var customer_details = [ {
            integrationRef: 'error_resp'
        } ];
        cin7.create_customer_record( customer_details, function ( err, ret ) {
            expect( ret.fields[ 0 ].success ).to.be.false;
            expect( ret.fields[ 0 ].errors[ 0 ] ).to.equal( 'error' );
            done();
        } );
    } );
} );

/************************************** New Tests for V1.1 functions ***************************************/

describe( 'cin7_create_sales_order() - Create a sales order', () => {
    it( 'should return a valid ret (ok:true) argument on success', ( done ) => {
        cin7.cin7_create_sales_order( 'win', 'deluxe-box', 's1', '3', '3', 'NOT_SET' )
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
