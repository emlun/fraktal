#!/bin/bash

npm run build && rsync -avP --delete build/ emlun.se:/srv/http/public/fraktal/
