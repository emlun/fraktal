fraktal
===

Fractal rendering sandbox, just for fun.

Try it here: https://emlun.se/fraktal/


Requirements
---

- [Rust][rust-lang]
- [trunk][trunk]


Usage
---

To run the development server:

```sh
$ cargo install trunk
$ trunk serve
$ $BROWSER http://localhost:8080
```

To build artifacts:

```sh
$ trunk build --release
```

Then copy the contents of `dist/` into your favourite web server.


[rust-lang]: https://www.rust-lang.org/learn/get-started
[trunk]: https://trunkrs.dev/
