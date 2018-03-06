const verification_token_check = (req, res, next) => {
  if ( req.query.token == process.env.VERIFICATION_TOKEN ) {
    next();
  }else{
    res.status( 403 ).send();
  }
};

exports.verification_token_check = verification_token_check;
