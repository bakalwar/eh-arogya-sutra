//! Exact 15-code C3D failure taxonomy (contract §7). Success OK is outside this set.
//! Provenance: adapted from C3C `windowsHandleSpike/src/codes.rs` (14 spike codes);
//! adds `InputControlFailed` and uses `RULE5_PROTECTED_RUNNER_*` namespace.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RunnerCode {
    UnsupportedPlatform,
    InvalidSelection,
    UnsupportedVolume,
    UnsafePathComponent,
    ReparseRejected,
    AdsRejected,
    HardlinkRejected,
    IdentityUnavailable,
    IdentityChanged,
    SharePolicyFailed,
    Oversize,
    ReadFailed,
    CleanupFailed,
    InputControlFailed,
    Internal,
}

impl RunnerCode {
    pub const ALL: [RunnerCode; 15] = [
        RunnerCode::UnsupportedPlatform,
        RunnerCode::InvalidSelection,
        RunnerCode::UnsupportedVolume,
        RunnerCode::UnsafePathComponent,
        RunnerCode::ReparseRejected,
        RunnerCode::AdsRejected,
        RunnerCode::HardlinkRejected,
        RunnerCode::IdentityUnavailable,
        RunnerCode::IdentityChanged,
        RunnerCode::SharePolicyFailed,
        RunnerCode::Oversize,
        RunnerCode::ReadFailed,
        RunnerCode::CleanupFailed,
        RunnerCode::InputControlFailed,
        RunnerCode::Internal,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            RunnerCode::UnsupportedPlatform => {
                "RULE5_PROTECTED_RUNNER_UNSUPPORTED_PLATFORM"
            }
            RunnerCode::InvalidSelection => "RULE5_PROTECTED_RUNNER_INVALID_SELECTION",
            RunnerCode::UnsupportedVolume => "RULE5_PROTECTED_RUNNER_UNSUPPORTED_VOLUME",
            RunnerCode::UnsafePathComponent => {
                "RULE5_PROTECTED_RUNNER_UNSAFE_PATH_COMPONENT"
            }
            RunnerCode::ReparseRejected => "RULE5_PROTECTED_RUNNER_REPARSE_REJECTED",
            RunnerCode::AdsRejected => "RULE5_PROTECTED_RUNNER_ADS_REJECTED",
            RunnerCode::HardlinkRejected => "RULE5_PROTECTED_RUNNER_HARDLINK_REJECTED",
            RunnerCode::IdentityUnavailable => {
                "RULE5_PROTECTED_RUNNER_IDENTITY_UNAVAILABLE"
            }
            RunnerCode::IdentityChanged => "RULE5_PROTECTED_RUNNER_IDENTITY_CHANGED",
            RunnerCode::SharePolicyFailed => "RULE5_PROTECTED_RUNNER_SHARE_POLICY_FAILED",
            RunnerCode::Oversize => "RULE5_PROTECTED_RUNNER_OVERSIZE",
            RunnerCode::ReadFailed => "RULE5_PROTECTED_RUNNER_READ_FAILED",
            RunnerCode::CleanupFailed => "RULE5_PROTECTED_RUNNER_CLEANUP_FAILED",
            RunnerCode::InputControlFailed => "RULE5_PROTECTED_RUNNER_INPUT_CONTROL_FAILED",
            RunnerCode::Internal => "RULE5_PROTECTED_RUNNER_INTERNAL",
        }
    }
}

/// If an error object is defined, `message === failureCode` (contract §6.4 / Q28).
impl std::fmt::Display for RunnerCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn taxonomy_count_unique_15() {
        assert_eq!(RunnerCode::ALL.len(), 15);
        let set: HashSet<&str> = RunnerCode::ALL.iter().map(|c| c.as_str()).collect();
        assert_eq!(set.len(), 15);
        assert!(set
            .iter()
            .all(|s| s.starts_with("RULE5_PROTECTED_RUNNER_")));
        assert!(!set.contains(&"RULE5_PROTECTED_RUNNER_OK"));
        assert_eq!(
            set.iter()
                .filter(|s| s.contains("INPUT_CONTROL_FAILED"))
                .count(),
            1
        );
        assert_eq!(
            set.iter().filter(|s| s.contains("CLEANUP_FAILED")).count(),
            1
        );
    }
}
