/*
 *
 *  lib_slack: this lib handles sending messages into Slack via incoming webhook. Nothing too fancy going
 *  on here.
 *
 *
 */

var request = require( 'request' );

exports.send = function ( reason, customer, subscription ) {

    switch ( reason ) {
    case 'subscription_created':
        local_send_new_subscriber( customer.first_name, customer.last_name, customer.email, subscription.shipping_address.city, subscription.plan_id );
        break;
    case 'subscription_cancelled':
        local_send_cancelled_subscription( customer.first_name, customer.last_name, customer.email, subscription.shipping_address.city, subscription.plan_id );
        break;
    default:
        return;
    }
};

function local_send_new_subscriber( first_name, last_name, email, city, sub_plan ) {

    var options = {
        method: 'POST',
        url: process.env.SLACK_WEBHOOK,
        body: {
            channel: '#new-subscribers',
            username: 'Good-News-Bot',
            icon_emoji: ':tada:',
            attachments: [ {
                text: 'Here are the details:',
                fallback: 'A new subscriber has joined!',
                title: 'Woo! A new subscriber has joined!',
                color: 'good',
                fields: [ {
                    title: 'Name',
                    value: first_name + ' ' + last_name,
                    short: true
                }, {
                    title: 'email',
                    value: email,
                    short: true
                }, {
                    title: 'Location',
                    value: city,
                    short: true
                }, {
                    title: 'Selected Plan',
                    value: sub_plan,
                    short: true
                } ]
            } ]
        },
        json: true
    };

    request( options, function ( error, response, body ) {

        if ( error ) {
            logger.error( 'Failed to send new subscriber alert to Slack: ' + JSON.stringify( body ) );
        }

    } );

}

function local_send_cancelled_subscription( first_name, last_name, email, city, sub_plan ) {

    var options = {
        method: 'POST',
        url: process.env.SLACK_WEBHOOK,
        body: {
            channel: '#cancelled-subs',
            username: 'Bad-News-Bot',
            icon_emoji: ':cry:',
            attachments: [ {
                text: 'Here are the details:',
                fallback: 'Someone has just cancelled their subscription',
                title: 'Boo! Someone has just cancelled their subscription!',
                color: 'bad',
                fields: [ {
                    title: 'Name',
                    value: first_name + ' ' + last_name,
                    short: true
                }, {
                    title: 'email',
                    value: email,
                    short: true
                }, {
                    title: 'Location',
                    value: city,
                    short: true
                }, {
                    title: 'Selected Plan',
                    value: sub_plan,
                    short: true
                } ]
            } ]
        },
        json: true
    };

    request( options, function ( error, response, body ) {

        if ( error ) {
            logger.error( 'Failed to send new subscriber alert to Slack: ' + JSON.stringify( body ) );
        }

    } );

}
