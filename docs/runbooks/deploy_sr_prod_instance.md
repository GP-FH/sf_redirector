# Deploying a Production Stitchfox Redirector Instance

NOTE: the below instructions use the `doctl` command line tool. You must have this installed + authorisation
to complete the provisioning/setup steps

## Provision new droplet with the correct settings
`doctl compute droplet create stitchfox --enable-monitoring --enable-private-networking --image ubuntu-16-04-x64  --region sgp1 --size 1gb --ssh-keys 38:65:28:82:1d:85:65:c5:e7:7f:55:10:ca:85:f0:0e,af:31:73:08:4a:d1:38:ed:89:78:db:94:74:9c:80:73 --tag-name production-redirector`

NOTE: the first ssh key fingerprint relates to the `sf-mac` key stored in DO and the `~/.ssh/id_rsa_sf` IdentityFile stored locally. The second relates to Deploybot and is used to push code

## Edit SSH config to allow SSH to new server
add lines to ~/.ssh/config:

```
Host [IP_OF_CREATED_INSTANCE]
      IdentityFile ~/.ssh/id_rsa_sf
```

## Install node + npm
`curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -`
`sudo apt-get install -y nodejs`
`sudo apt-get install -y build-essential`

## Install + configure PM2
To install: `npm install pm2@latest -g`
To setup pm2 to keep app running across machine startups: `pm2 startup`

## Apply SSL cert
- Done using certbot

## Deploy code to new machine via Deploybot
- Head to `Production Environment -> Servers & Settings`
- Enter the settings for the current server configuration
- Change the selected droplet to the newly created instance and save changes
- Head to `Production Environment -> History`
- Bonk the `Deploy` button

## Update domain record to point to newly provisioned instance
Find the A record for redirect.wowzers.work: `doctl compute domain records list wowzers.work`. Note the ID
Update it: `doctl compute domain records update wowzers.work --record-id [ID_FROM_PREVIOUS_COMMAND] --record-type A --record-name redirect --record-data [IP_OF_CREATED_INSTANCE]`
