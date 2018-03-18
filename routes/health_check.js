/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * This route handles DO Load Balancer health checks (only in prod)
 * For settings see sf-lb-001 load balancer in DigitalOcean
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const express = require("express");
const os = require("os");
const router = express.Router();

router.get( '/', function (req, res, next) {
  res.status( 200 ).end();
});

module.exports = router;
