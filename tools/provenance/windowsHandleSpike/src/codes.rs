//! Exact 14-code taxonomy (C3C-C02). No extras. No native error embedding.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SpikeCode {
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
    Internal,
}

impl SpikeCode {
    pub const ALL: [SpikeCode; 14] = [
        SpikeCode::UnsupportedPlatform,
        SpikeCode::InvalidSelection,
        SpikeCode::UnsupportedVolume,
        SpikeCode::UnsafePathComponent,
        SpikeCode::ReparseRejected,
        SpikeCode::AdsRejected,
        SpikeCode::HardlinkRejected,
        SpikeCode::IdentityUnavailable,
        SpikeCode::IdentityChanged,
        SpikeCode::SharePolicyFailed,
        SpikeCode::Oversize,
        SpikeCode::ReadFailed,
        SpikeCode::CleanupFailed,
        SpikeCode::Internal,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            SpikeCode::UnsupportedPlatform => {
                "RULE5_WINDOWS_HANDLE_SPIKE_UNSUPPORTED_PLATFORM"
            }
            SpikeCode::InvalidSelection => "RULE5_WINDOWS_HANDLE_SPIKE_INVALID_SELECTION",
            SpikeCode::UnsupportedVolume => "RULE5_WINDOWS_HANDLE_SPIKE_UNSUPPORTED_VOLUME",
            SpikeCode::UnsafePathComponent => {
                "RULE5_WINDOWS_HANDLE_SPIKE_UNSAFE_PATH_COMPONENT"
            }
            SpikeCode::ReparseRejected => "RULE5_WINDOWS_HANDLE_SPIKE_REPARSE_REJECTED",
            SpikeCode::AdsRejected => "RULE5_WINDOWS_HANDLE_SPIKE_ADS_REJECTED",
            SpikeCode::HardlinkRejected => "RULE5_WINDOWS_HANDLE_SPIKE_HARDLINK_REJECTED",
            SpikeCode::IdentityUnavailable => {
                "RULE5_WINDOWS_HANDLE_SPIKE_IDENTITY_UNAVAILABLE"
            }
            SpikeCode::IdentityChanged => "RULE5_WINDOWS_HANDLE_SPIKE_IDENTITY_CHANGED",
            SpikeCode::SharePolicyFailed => "RULE5_WINDOWS_HANDLE_SPIKE_SHARE_POLICY_FAILED",
            SpikeCode::Oversize => "RULE5_WINDOWS_HANDLE_SPIKE_OVERSIZE",
            SpikeCode::ReadFailed => "RULE5_WINDOWS_HANDLE_SPIKE_READ_FAILED",
            SpikeCode::CleanupFailed => "RULE5_WINDOWS_HANDLE_SPIKE_CLEANUP_FAILED",
            SpikeCode::Internal => "RULE5_WINDOWS_HANDLE_SPIKE_INTERNAL",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn taxonomy_count_unique_14() {
        assert_eq!(SpikeCode::ALL.len(), 14);
        let set: HashSet<&str> = SpikeCode::ALL.iter().map(|c| c.as_str()).collect();
        assert_eq!(set.len(), 14);
        assert!(set.iter().all(|s| s.starts_with("RULE5_WINDOWS_HANDLE_SPIKE_")));
        assert_eq!(
            set.iter()
                .filter(|s| s.contains("CLEANUP_FAILED"))
                .count(),
            1
        );
    }
}
