#[derive(PartialEq)]
pub struct Preset {
    pub name: &'static str,
    pub state: &'static str,
}

pub static PRESETS: [Preset; 9] = [
    Preset {
        name: "Classic",
        state: "0:eNptisEJACAMA_NwB8dxAZdwA8fsVieCto82ELiEk6rsYTG4bVmiP5iC9U-EOcMBjOYO_A",
    },
    Preset {
        name: "Hyperspace",
        state: "0:eNplzCsKgEAUheEjgnmqzWRyC2I1GGzuw1UYxQU5SxFBs1aDnHnDwPzlftxwgOpZ_lMC4zdtVwfb26J0os6cAkmUHjV6iix8b87BzUCRO677wXhTAQL9HS4",
    },
    Preset {
        name: "My burning heart",
        state: "0:eNply6ENgDAUhOFHggSDAw8aRzBoHJowAzOUMXBINBM8RwfoGjWd4NqmreqfXPKZu5XU0_5z89Tn3Bse1rcdu2-5KkrBr6QsbBHC-SiCWRDSFyBY0mEWUA",
    },
    Preset {
        name: "Poseidon's armory",
        state: "0:eNpFjD0OQEAYRD-ERKMUqxY1B9BLNG6hcYftlAoHEJ1TiESlWofQOIJuRPZvkkneTPGyo73c5d3jQAxj1G95vbIiLStipIO_vhoP2X92FPEGiSdRnIQplNzdHMYD4AOHFRkO",
    },
    Preset {
        name: "The Radiance",
        state: "0:eNpljb8KQFAUxm8UiuxuWY1SJoOs3sCMmQfwIh7BbPdnsFlM3kA3L6A7HhenKL_l_Po6fV_NbJ_u69gvw8yDLXLixvJoGxKL3IDgOhr5AaWE5iYwyRhyAkx580pFzztI9Ucz0WmY-H8U8N06Afn7KGQ",
    },
    Preset {
        name: "Singularity",
        state: "0:eNpliCEOgCAARTFAtOsBzFaLmJzB42jmCM5TmD2Bzs1odINO4BYfGIPC29729h5Fx93811euy91p3kxH1dZnPzASgZeSDGyxhIBMF5iLkK9rztKGBUGZHTQ",
    },
    Preset {
        name: "The day they came",
        state: "0:eNpNirEJwCAURH9IylQhBJIBUmeBIHZuZSuu4AAOIIidKziElUucWHzw4ODu8WQ8982UnC53BFTxKn9_z_K3lTgY5WsnnnlrAvsAoQOiCRPd",
    },
    Preset {
        name: "Wildfire",
        state: "0:eNplizsNgDAABY-EwIYGLIAAUIAHnKADNTB36lIBXWvi9ZdOveTl3XIAq_u_dNw-nBTswU5DeSMd2oYqL4uuqbp5ZrVWQhEBThDJ",
    },
    Preset {
        name: "Xen lightning",
        state: "0:eNpFjD0OQEAYRLdBJCRKotVqdbJuoXeCjcIdNOIILiBxA4UbUEg0JGgcQDt-PhsvmeTNFFPb81ZYY8tFEHXZztmLCJnDJHiifqVU_r3XSOI1x6STn4OP1CBPqgONSb64HuQnbi7urx5p",
    },
];

#[cfg(test)]
mod tests {
    use crate::EngineSettings;

    use super::PRESETS;

    pub static LEGACY_PRESETS: [&'static str; 8] = [
        "0:eNptikENACAMA_vAAz4wgAFM4ACZc3WEZMBja9Lk2pyUZXX7g9MSJarDEMx7IuwxNOcNBmUPLg",
        "0:eNpljCsKgEAAREcE81abyWSyi9VgsHkPT2EUD-QeRQTNWg0y7hcW9pV5DMMAxT1_hwSGd1zPFoanQW6NCh0ZIiidlOgoEt9enLxXPUVqddl2hp-1m_zt_R1g",
        "0:eNpli6ENgDAURD8JEgwOPGiCIRg0Dk2YgRnKGDgkmgm-gwG6Rk0nuLZpq_qSS564d8lfjdvH1V0eU6u5W566b975LCgCt5wSsAYR1vfMOwtCbAHCED4GhoAWgg",
        "0:eNpFzDEOQEAQBdBBSDRKsWpRo9dLNG6hcYftlAoHEJ1TiESlWofQOILui-xgkkne_8WP1mo3x2vxHdV2XjPHxSSSMM1J0Ht43uZw0t8PBkuWCCxNtRF6V7s-JL4dABnzBlEkGUA",
        "0:eNpljb8KQFAUxm8UiuyU1SgxGWT1BmbMPIAX8Qhmuz-DzWLyBrp5Ad3xuDhF-S3n19fX-Wpq-ea-jv0yzCzYIjtuDNdsQ2KQG-BcRyE_oBTQnAQmEUNGgEpvXsnoeQep-mjGf2o69o8Cvlse1k8-ySiW",
        "0:eNplii0KgDAAhWfYol0PYBabxZnE4HE07wjiKcyeQBGMRkG7Ybd429hP2QcPPj7e-dFukc9-p9N41D8v-jUr861pGfHAjJIIzN6EwBsqMCRWL-2chYzKXRQs2B1m",
        "0:eNpNirEJgDAURL9oaSUi6ADWYi9i51ZpQ1bIABkgENJlhQyRKktcCORDDg7uHu9z6zzJGPymF4v0nr_Zr2N48kgc1PJVHQ-8BYF9gHA3XABCkBQP",
        "0:eNpljLsNgDAUAw8JQccMrAADwATswCbMwTRQU9FkgLRZwvnpVTnJ8jU2wOzeJxWnDzuFf2PFUE5Pg5auys2kY6j-XaNsKyG7iYkmEPs",
    ];

    #[test]
    fn parse_presets() -> Result<(), Box<dyn std::error::Error>> {
        for preset in &PRESETS {
            EngineSettings::try_restore(preset.state)?;
        }
        Ok(())
    }

    #[test]
    fn parse_legacy_presets() -> Result<(), Box<dyn std::error::Error>> {
        for preset in &LEGACY_PRESETS {
            EngineSettings::try_restore(preset)?;
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
