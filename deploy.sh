#!/bin/bash

# Exit on error
set -e

# Echo commands
set -x

cargo test && cargo clippy -- -D warnings
trunk build --release --public-url /fraktal
rsync -avP --delete dist/ emlun.se:/srv/http/public/fraktal/
