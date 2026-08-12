//! Provenance: adapted from C3C windowsHandleSpike/src/volume.rs (pure volume classifier).
//! Pure volume policy classifier (T10-NEG) and observation types.
//! Documented GetDriveTypeW values (MSDN) used as observation enums only.

use crate::codes::RunnerCode;

/// Documented Win32 drive-type observation (GetDriveTypeW return family).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DriveTypeObs {
    Unknown = 0,
    NoRootDir = 1,
    Removable = 2,
    Fixed = 3,
    Remote = 4,
    Cdrom = 5,
    Ramdisk = 6,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VolumeObservation {
    pub drive_type: DriveTypeObs,
    /// True when GetVolumeInformationW reports NTFS (case-insensitive).
    pub is_ntfs: bool,
}

/// Immutable pure classifier: accepted volume must be FIXED + NTFS.
pub fn classify_volume_observation(obs: &VolumeObservation) -> Result<(), RunnerCode> {
    if obs.drive_type != DriveTypeObs::Fixed || !obs.is_ntfs {
        return Err(RunnerCode::UnsupportedVolume);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn t10_neg_all_rejected_drive_types() {
        let bad_types = [
            DriveTypeObs::Unknown,
            DriveTypeObs::NoRootDir,
            DriveTypeObs::Removable,
            DriveTypeObs::Remote,
            DriveTypeObs::Cdrom,
            DriveTypeObs::Ramdisk,
        ];
        for dt in bad_types {
            let obs = VolumeObservation {
                drive_type: dt,
                is_ntfs: true,
            };
            assert_eq!(
                classify_volume_observation(&obs),
                Err(RunnerCode::UnsupportedVolume)
            );
        }
        let non_ntfs = VolumeObservation {
            drive_type: DriveTypeObs::Fixed,
            is_ntfs: false,
        };
        assert_eq!(
            classify_volume_observation(&non_ntfs),
            Err(RunnerCode::UnsupportedVolume)
        );
        let ok = VolumeObservation {
            drive_type: DriveTypeObs::Fixed,
            is_ntfs: true,
        };
        assert!(classify_volume_observation(&ok).is_ok());
    }
}
