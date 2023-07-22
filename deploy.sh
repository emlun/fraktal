#!/bin/bash

# Exit on error
set -e

# Echo commands
set -x

cargo test && cargo clippy -- --all-targets -D warnings
trunk build --release --public-url /fraktal
rsync -avP --delete dist/ emlun.se:/srv/http/public/fraktal/
