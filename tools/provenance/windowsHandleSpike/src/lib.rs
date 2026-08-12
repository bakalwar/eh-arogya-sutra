//! P2-C3C synthetic Windows handle-hardening spike library.
//!
//! Out-of-process helper only. Synthetic temp trees only. No protected source,
//! no hash, no manifest, no network/telemetry.

#![cfg_attr(not(windows), allow(dead_code))]

pub mod codes;
pub mod identity;
pub mod outcome;
pub mod path_lex;
pub mod platform;
pub mod procedure;
pub mod volume;

use codes::SpikeCode;
use outcome::SpikeResult;

/// Maximum accepted synthetic file size (bytes).
pub const MAX_ACCEPTED_BYTES: u64 = 262_144;
/// Read probe ceiling (bytes): one past the accepted maximum.
pub const READ_PROBE_CEILING: u64 = 262_145;

/// Run the production spike against a drive-letter selection string.
///
/// Path input must arrive via stdin for the binary (Q03: not argv/env/stdout/stderr).
pub fn run_spike_selection(selection: &str) -> SpikeResult {
    #[cfg(not(windows))]
    {
        let _ = selection;
        return SpikeResult::failed(SpikeCode::UnsupportedPlatform);
    }
    #[cfg(windows)]
    {
        let _ = SpikeCode::Internal; // keep taxonomy linked on Windows builds
        procedure::run_windows_spike(selection)
    }
}

/// Emit exactly one JSON line with deterministic key order: `code` then `outcome`.
pub fn format_result_json(result: &SpikeResult) -> String {
    let code_json = match &result.code {
        Some(c) => format!("\"{}\"", c.as_str()),
        None => "null".to_string(),
    };
    format!(
        "{{\"code\":{},\"outcome\":\"{}\"}}\n",
        code_json,
        result.outcome.as_str()
    )
}

pub use identity::{identity_tuples_equal, IdentityTuple};
pub use path_lex::{validate_external_selection, PathPlan};
pub use volume::{classify_volume_observation, DriveTypeObs, VolumeObservation};
