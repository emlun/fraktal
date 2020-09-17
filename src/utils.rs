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
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

/// A container that keeps track of when its contained value has been mutated.
#[derive(Clone)]
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
