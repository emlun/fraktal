#!/bin/bash

# Exit on error
set -e

# Echo commands
set -x

cargo test
cd www && npm run lint && cd -
wasm-pack build
cd www
npm run build
rsync -avP --delete build/ emlun.se:/srv/http/public/fraktal/
