//! P2-C3D synthetic Windows protected-runner library.
//!
//! Out-of-process helper only. Synthetic fixtures only. No protected source,
//! no hash, no manifest, no network/telemetry.
//!
//! Provenance: module layout and security-reviewed algorithms adapted from
//! C3C `tools/provenance/windowsHandleSpike/` (PR #78 / B1–B2 corrections).
//! Namespace, outcomes, and envelope are C3D-specific (`RULE5_PROTECTED_RUNNER_*`).

#![cfg_attr(not(windows), allow(dead_code))]

pub mod codes;
pub mod identity;
pub mod outcome;
pub mod path_lex;
pub mod platform;
pub mod procedure;
pub mod stdin_channel;
pub mod volume;

use outcome::RunnerResult;

/// Maximum accepted synthetic file size (bytes). Contract / C3C-Q13 reuse.
pub const MAX_ACCEPTED_BYTES: u64 = 262_144;
/// Read probe ceiling (bytes): one past the accepted maximum.
pub const READ_PROBE_CEILING: u64 = 262_145;

/// Locked process exit code for every expected non-success / INTERNAL mapping.
pub const EXIT_NON_SUCCESS: i32 = 1;
pub const EXIT_SUCCESS: i32 = 0;

/// Run the production protected-runner procedure against a drive-letter selection.
///
/// Binary path input must arrive via stdin (Q10: not argv/env).
pub fn run_runner_selection(selection: &str) -> RunnerResult {
    #[cfg(not(windows))]
    {
        let _ = selection;
        return RunnerResult::failed(RunnerCode::UnsupportedPlatform);
    }
    #[cfg(windows)]
    {
        procedure::run_windows_runner(selection)
    }
}

/// Emit exactly one JSON line with key order: `code` then `outcome`, trailing LF.
pub fn format_result_json(result: &RunnerResult) -> String {
    format!(
        "{{\"code\":\"{}\",\"outcome\":\"{}\"}}\n",
        result.code_str(),
        result.outcome.as_str()
    )
}

pub use identity::{identity_tuples_equal, IdentityTuple};
pub use path_lex::{validate_external_selection, PathPlan};
pub use stdin_channel::parse_stdin_channel;
pub use volume::{classify_volume_observation, DriveTypeObs, VolumeObservation};
