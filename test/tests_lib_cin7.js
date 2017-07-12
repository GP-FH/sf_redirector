/*lib_cin7.js tests*/

var should = require( 'chai' ).should();
var expect = require( 'chai' ).expect;
var nock = require( 'nock' );
var cin7 = require( '../libs/lib_cin7.js' );

//  mock call - get customer record
nock( 'https://api.cin7.com:443', {
        "encodedQueryParams": true
    } )
    .get( '/api/v1/Contacts' )
    .query( {
        "fields": "id",
        "where": "email%3D%27asdas%40asjdnas.com%27"
    } ) // customer not found
    .reply( 200, [], [ 'Cache-Control',
        'no-cache',
        'Pragma',
        'no-cache',
        'Content-Type',
        'application/json; charset=utf-8',
        'Expires',
        '-1',
        'Server',
        'Microsoft-IIS/8.5',
        'Cin7-Served-By',
        'cin7-akl-web01',
        'Date',
        'Wed, 12 Jul 2017 12:37:09 GMT',
        'Connection',
        'close',
        'Content-Length',
        '2'
    ] );

//  mock call - create contact
nock( 'https://api.cin7.com:443', {
        "encodedQueryParams": true
    } )
    .post( '/api/v1/Contacts' )
    .reply( 200, [ { //success
        "index": 0,
        "success": true,
        "id": 13,
        "code": "asdas@asjdnas.com",
        "errors": []
    } ] );

//  mock request - create sales order
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
        var email = 'test@exists.com';
        cin7.get_customer_record( 'id', 'email=\'' + email + '\'', function ( err, ret ) {
            expect( ret.fields ).to.be.empty;
            done();
        } );
    } );
} );
