var request = require( 'request' );

exports.send = function ( first_name, last_name, email, city, sub_plan ) {

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

};
