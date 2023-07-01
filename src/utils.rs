use std::fmt::Debug;
use std::ops::Deref;
use std::rc::Rc;

use serde::Deserialize;
use serde::Deserializer;
use serde::Serialize;
use serde::Serializer;

pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[allow(unused_macros)]
macro_rules! log_println {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into())
    }
}
#[allow(unused_imports)]
pub(crate) use log_println;

#[allow(unused_macros)]
macro_rules! error_println {
    ( $( $t:tt )* ) => {
        web_sys::console::error_1(&format!( $( $t )* ).into())
    }
}
pub(crate) use error_println;

#[allow(unused_macros)]
macro_rules! log {
    ( $t:expr ) => {
        web_sys::console::log_1(&$t.into())
    };
    ( $t:expr, ) => {
        web_sys::console::log_1(&$t.into())
    };
    ( $t1:expr, $t2:expr ) => {
        web_sys::console::log_2(&$t1.into(), &$t2.into())
    };
    ( $t1:expr, $t2:expr, ) => {
        web_sys::console::log_2(&$t1.into(), &$t2.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr ) => {
        web_sys::console::log_3(&$t1.into(), &$t2.into(), &$t3.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, ) => {
        web_sys::console::log_3(&$t1.into(), &$t2.into(), &$t3.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr ) => {
        web_sys::console::log_4(&$t1.into(), &$t2.into(), &$t3.into(), &$t4.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, ) => {
        web_sys::console::log_4(&$t1.into(), &$t2.into(), &$t3.into(), &$t4.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr ) => {
        web_sys::console::log_5(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
        )
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr, ) => {
        web_sys::console::log_5(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
        )
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr, $t6:expr ) => {
        web_sys::console::log_6(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
            &$t6.into(),
        )
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr, $t6:expr, ) => {
        web_sys::console::log_6(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
            &$t6.into(),
        )
    };
}
#[allow(unused_imports)]
pub(crate) use log;

#[allow(unused_macros)]
macro_rules! error_log {
    ( $t:expr ) => {
        web_sys::console::error_1(&$t.into())
    };
    ( $t:expr, ) => {
        web_sys::console::error_1(&$t.into())
    };
    ( $t1:expr, $t2:expr ) => {
        web_sys::console::error_2(&$t1.into(), &$t2.into())
    };
    ( $t1:expr, $t2:expr, ) => {
        web_sys::console::error_2(&$t1.into(), &$t2.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr ) => {
        web_sys::console::error_3(&$t1.into(), &$t2.into(), &$t3.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, ) => {
        web_sys::console::error_3(&$t1.into(), &$t2.into(), &$t3.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr ) => {
        web_sys::console::error_4(&$t1.into(), &$t2.into(), &$t3.into(), &$t4.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, ) => {
        web_sys::console::error_4(&$t1.into(), &$t2.into(), &$t3.into(), &$t4.into())
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr ) => {
        web_sys::console::error_5(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
        )
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr, ) => {
        web_sys::console::error_5(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
        )
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr, $t6:expr ) => {
        web_sys::console::error_6(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
            &$t6.into(),
        )
    };
    ( $t1:expr, $t2:expr, $t3:expr, $t4:expr, $t5:expr, $t6:expr, ) => {
        web_sys::console::error_6(
            &$t1.into(),
            &$t2.into(),
            &$t3.into(),
            &$t4.into(),
            &$t5.into(),
            &$t6.into(),
        )
    };
}
pub(crate) use error_log;

/// A container that keeps track of when its contained value has been mutated.
#[derive(Clone, Debug)]
pub struct Pristine<T> {
    inner: T,
    dirty: bool,
}

impl<T> Pristine<T> {
    /// Wrap the given value in a new container. The value is initially dirty.
    pub fn new(inner: T) -> Self {
        Pristine { inner, dirty: true }
    }

    /// Access the contained value, without making it dirty.
    pub fn get(&self) -> &T {
        &self.inner
    }

    /// Access the contained value only if it is already dirty, and then make it clean.
    pub fn get_dirty(&mut self) -> Option<&T> {
        if self.dirty {
            self.dirty = false;
            Some(&self.inner)
        } else {
            None
        }
    }

    /// Access the contained value mutably, and make it dirty.
    pub fn get_mut(&mut self) -> &mut T {
        self.dirty = true;
        &mut self.inner
    }
}

impl<T> From<T> for Pristine<T> {
    fn from(value: T) -> Self {
        Self::new(value)
    }
}

impl<T> std::ops::Deref for Pristine<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        self.get()
    }
}

impl<T> std::ops::DerefMut for Pristine<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.get_mut()
    }
}

impl<T> PartialEq for Pristine<T>
where
    T: PartialEq,
{
    fn eq(&self, rhs: &Self) -> bool {
        self.inner == rhs.inner
    }
}

impl<T> Default for Pristine<T>
where
    T: Default,
{
    fn default() -> Self {
        Self::new(Default::default())
    }
}

impl<'de, T> Deserialize<'de> for Pristine<T>
where
    T: Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let inner = T::deserialize(deserializer)?;
        Ok(Self::new(inner))
    }
}

impl<T> Serialize for Pristine<T>
where
    T: Serialize,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.inner.serialize(serializer)
    }
}

/// A container that holds changes to a value until a consumer is ready to
/// receive them, then presents both the previous value and the new value when
/// the consumer requests them.
#[derive(Clone, Debug, PartialEq)]
pub struct Ratchet<T> {
    current: T,
    next: Option<T>,
}

impl<T> Ratchet<T> {
    /// Wrap the given value in a new container.
    pub fn new(value: T) -> Self {
        Self {
            current: value,
            next: None,
        }
    }

    /// Access the current value.
    pub fn current(&self) -> &T {
        &self.current
    }

    /// If a new value is queued, update the current value to the new value and
    /// return `(old, &new)`.
    pub fn latch(&mut self) -> Option<(T, &T)> {
        if let Some(mut next) = self.next.take() {
            std::mem::swap(&mut self.current, &mut next);
            let old = next;
            self.next = None;
            Some((old, &self.current))
        } else {
            None
        }
    }

    /// Queue a new value, overwriting the currently queued one if any.
    pub fn set(&mut self, next: T) -> &mut Self {
        self.next = Some(next);
        self
    }

    /// Queue a new value by updating the currently queued value, or the current
    /// value if no new value is yet queued.
    pub fn update<F>(&mut self, f: F) -> &mut Self
    where
        F: Fn(&T) -> T,
    {
        self.set(f(self.next.as_ref().unwrap_or(&self.current)))
    }
}

impl<T> From<T> for Ratchet<T> {
    fn from(value: T) -> Self {
        Self::new(value)
    }
}

impl<T> Default for Ratchet<T>
where
    T: Default,
{
    fn default() -> Self {
        Self::new(Default::default())
    }
}

impl<'de, T> Deserialize<'de> for Ratchet<T>
where
    T: Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let inner = T::deserialize(deserializer)?;
        Ok(Self::new(inner))
    }
}

impl<T> Serialize for Ratchet<T>
where
    T: Serialize,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.current.serialize(serializer)
    }
}

#[derive(Debug)]
pub struct PtrEq<T>(Rc<T>);

impl<T> PartialEq for PtrEq<T> {
    fn eq(&self, rhs: &Self) -> bool {
        Rc::ptr_eq(&self.0, &rhs.0)
    }
}

impl<T> Deref for PtrEq<T> {
    type Target = Rc<T>;
    fn deref(&self) -> &<Self as Deref>::Target {
        &self.0
    }
}

impl<T> PtrEq<T> {
    pub fn new(v: Rc<T>) -> Self {
        Self(v)
    }
}
