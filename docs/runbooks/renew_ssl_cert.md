# Renewing SSL cert on box

All certs are managed by Certbot which makes things super easy! To renew a cert:

- `certbot renew --dry-run` - this will simulate a renewal and will let you know if it will succeed or not. A common cause for for this failing is port 443 bing busy. This will most likely be due to the app running (you'll need to stop it with `pm2 stop all`).
- Once the dry run is working then just type `certbot renew` and Voila, you have a cert for 90 days

(this should really be done via cron or systemd job and will be sorted soon)
