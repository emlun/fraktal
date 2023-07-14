#[derive(PartialEq)]
pub struct Preset {
    pub name: &'static str,
    pub state: &'static str,
}

pub static PRESETS: [Preset; 8] = [
    Preset {
        name: "Classic",
        state: "0:eNptikENACAMA_vAAz4wgAFM4ACZc3WEZMBja9Lk2pyUZXX7g9MSJarDEMx7IuwxNOcNBmUPLg",
    },
    Preset {
        name: "Hyperspace",
        state: "0:eNpljCsKgEAAREcE81abyWSyi9VgsHkPT2EUD-QeRQTNWg0y7hcW9pV5DMMAxT1_hwSGd1zPFoanQW6NCh0ZIiidlOgoEt9enLxXPUVqddl2hp-1m_zt_R1g",
    },
    Preset {
        name: "My burning heart",
        state: "0:eNpli6ENgDAURD8JEgwOPGiCIRg0Dk2YgRnKGDgkmgm-gwG6Rk0nuLZpq_qSS564d8lfjdvH1V0eU6u5W566b975LCgCt5wSsAYR1vfMOwtCbAHCED4GhoAWgg",
    },
    Preset {
        name: "Poseidon's armory",
        state: "0:eNpFzDEOQEAQBdBBSDRKsWpRo9dLNG6hcYftlAoHEJ1TiESlWofQOILui-xgkkne_8WP1mo3x2vxHdV2XjPHxSSSMM1J0Ht43uZw0t8PBkuWCCxNtRF6V7s-JL4dABnzBlEkGUA",
    },
    Preset {
        name: "The Radiance",
        state: "0:eNpljb8KQFAUxm8UiuyU1SgxGWT1BmbMPIAX8Qhmuz-DzWLyBrp5Ad3xuDhF-S3n19fX-Wpq-ea-jv0yzCzYIjtuDNdsQ2KQG-BcRyE_oBTQnAQmEUNGgEpvXsnoeQep-mjGf2o69o8Cvlse1k8-ySiW",
    },
    Preset {
        name: "Singularity",
        state: "0:eNplii0KgDAAhWfYol0PYBabxZnE4HE07wjiKcyeQBGMRkG7Ybd429hP2QcPPj7e-dFukc9-p9N41D8v-jUr861pGfHAjJIIzN6EwBsqMCRWL-2chYzKXRQs2B1m",
    },
    Preset {
        name: "The day they came",
        state: "0:eNpNirEJgDAURL9oaSUi6ADWYi9i51ZpQ1bIABkgENJlhQyRKktcCORDDg7uHu9z6zzJGPymF4v0nr_Zr2N48kgc1PJVHQ-8BYF9gHA3XABCkBQP",
    },
    Preset {
        name: "Wildfire",
        state: "0:eNpljLsNgDAUAw8JQccMrAADwATswCbMwTRQU9FkgLRZwvnpVTnJ8jU2wOzeJxWnDzuFf2PFUE5Pg5auys2kY6j-XaNsKyG7iYkmEPs",
    },
];

#[cfg(test)]
mod tests {
    use crate::EngineSettings;

    use super::PRESETS;

    #[test]
    fn parse_presets() -> Result<(), Box<dyn std::error::Error>> {
        for preset in &PRESETS {
            EngineSettings::try_restore(preset.state)?;
        }
        Ok(())
    }

    #[test]
    fn presets_are_canonical() -> Result<(), Box<dyn std::error::Error>> {
        for preset in &PRESETS {
            let settings = EngineSettings::try_restore(preset.state).unwrap();
            let serialized = settings.serialize().unwrap();
            assert_eq!(preset.state, serialized, "Preset: {}", preset.name);
        }
        Ok(())
    }
}
