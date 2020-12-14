fraktal
===

Fractal rendering sandbox, just for fun.

Try it here: https://emlun.se/fraktal/


Requirements
---

- [Rust][rust-lang]
- [npm][npm]


Usage
---

To run the development server:

```
$ npm --prefix www install
$ npm --prefix www run build-wasm
$ npm --prefix www start
$ $BROWSER http://localhost:8080
```

Re-run `npm run build-wasm` whenever you edit the Rust code.

To build artifacts:

```
$ npm --prefix www install
$ npm --prefix www run build
```

Then copy the contents of `www/build/` into your favourite web server.



[npm]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[rust-lang]: https://www.rust-lang.org/learn/get-started
[wasm-pack]: https://rustwasm.github.io/docs/wasm-pack/quickstart.html
