/*
 *  lib_cin7.js test suite: unit tests to make sure lib functions are returning expected values
 */

var expect = require( 'chai' ).expect;
var nock = require( 'nock' );
var cin7 = require( '../libs/lib_cin7.js' );

//  mock call - customer records
nock( 'https://api.cin7.com:443', {
        "encodedQueryParams": true
    } )
    .log( console.log )
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



//  mock request - create sales order TODO
nock( 'https://api.cin7.com:443', {
        "encodedQueryParams": true
    } ).post( '/api/v1/SalesOrders' )
    .reply( 200, [ { // success
        "index": 0,
        "success": true,
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
