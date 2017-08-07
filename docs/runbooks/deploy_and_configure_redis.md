# Deploying an configuring a redis box

NOTE: this runbook just gives the instructions for a standard setup. It does not include instructions for setting up master/slave replication either from scratch or in the more likely event of dealing with a failure (e.g promoting slave to master and provisioning a new slave). This will be documented separately.

## Install build & test dependencies
`sudo apt-get update`
`sudo apt-get install build-essential tcl`

## Download, Compile, and Install Redis
`cd /tmp`
`curl -O http://download.redis.io/redis-stable.tar.gz`
`tar xzvf redis-stable.tar.gz`
`cd redis-stable`

## Build and Install Redis
`make`
`make test`
`make install`

## Configure Redis
`mkdir /etc/redis`
`cp /tmp/redis-stable/redis.conf /etc/redis`
`vim /etc/redis/redis.conf` : In the file, find the `supervised` directive. Currently, this is set to `no`. Since we are running an operating system that uses the systemd init system, we can change this to `systemd`

Next, find the `dir` directive. This option specifies the directory that Redis will use to dump persistent data. We need to pick a location that Redis will have write permission and that isn't viewable by normal users: `/var/lib/redis`

Finally, find the `appendonly` directory and set this from `no` to `yes`. This will neable `AOF` storage.

## Create a Redis systemd Unit File
`vim /etc/systemd/system/redis.service`

Copy/paste the following into the file you just created:

```
[Unit]
Description=Redis In-Memory Data Store
After=network.target

[Service]
User=redis
Group=redis
ExecStart=/usr/local/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/local/bin/redis-cli shutdown
Restart=always

[Install]
WantedBy=multi-user.target
```

## Create the Redis User, Group and Directories
`adduser --system --group --no-create-home redis`
`mkdir /var/lib/redis`
`chown redis:redis /var/lib/redis`
`chmod 770 /var/lib/redis`

## Start the Redis Service
`systemctl start redis`

## Enable Redis to Start at Boot
`systemctl enable redis`
