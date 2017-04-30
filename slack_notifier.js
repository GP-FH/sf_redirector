var request = require( 'request' );

exports.send = function ( first_name, last_name, email, city, sub_plan ) {

  var options = {
    method: 'POST',
    url: 'https://hooks.slack.com/services/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',
    body: {
      channel: '#new-subscribers',
      username: 'Good-News-Bot',
      icon_emoji: ':ta-da:',
      attachments: [ {
        text: 'Here are the details:',
        fallback: 'A new subscriber has joined!',
        title: 'Woo! A new subscriber has joined!',
        color: 'good',
        fields: [ {
          title: 'Name',
          value: first_name + ' ' + last_name,
          short: false
        }, {
          title: 'email',
          value: email,
          short: false
        }, {
          title: 'Location',
          value: city,
          short: true
        }, {
          title: 'Selected Plan',
          value: sub_plan,
          short: false
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
