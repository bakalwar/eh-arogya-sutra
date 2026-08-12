//! Out-of-process C3D protected-runner binary.
//!
//! Input (C3D-Q10): one UTF-8 absolute drive-letter path on **stdin** (not argv/env).
//! Output: exactly one JSON line on stdout (`code` then `outcome`); stderr empty.
//!
//! Provenance: panic-redaction / catch_unwind pattern from C3C B2
//! (`windowsHandleSpike/src/main.rs`). Envelope and stdin mapping are C3D-specific.
//!
//! Unwindable Rust panics → INTERNAL + PROCEDURE_NON_SUCCESS, empty stderr.
//! Process-abort / OOM are not claimed to be caught.

use std::io::{self, Read, Write};
use std::panic::{self, AssertUnwindSafe};

use ehas2_windows_protected_runner::codes::RunnerCode;
use ehas2_windows_protected_runner::outcome::{RunnerOutcome, RunnerResult};
use ehas2_windows_protected_runner::{
    format_result_json, parse_stdin_channel, run_runner_selection, EXIT_NON_SUCCESS,
    EXIT_SUCCESS,
};

fn main() {
    // Silent hook: unwindable panics must not print to stderr.
    panic::set_hook(Box::new(|_| {}));

    let prepared = panic::catch_unwind(AssertUnwindSafe(|| {
        let result = match read_stdin_selection() {
            Ok(sel) => run_runner_selection(&sel),
            Err(code) => RunnerResult::failed(code),
        };
        let line = format_result_json(&result);
        let code = exit_code_for(&result);
        (line, code)
    }));

    let (line, code) = match prepared {
        Ok(v) => v,
        Err(_) => {
            let failed = RunnerResult::failed(RunnerCode::Internal);
            (format_result_json(&failed), EXIT_NON_SUCCESS)
        }
    };

    write_stdout_once(line.as_bytes());
    std::process::exit(code);
}

fn exit_code_for(result: &RunnerResult) -> i32 {
    match result.outcome {
        RunnerOutcome::ProcedureCompleted => EXIT_SUCCESS,
        RunnerOutcome::ProcedureNonSuccess => EXIT_NON_SUCCESS,
    }
}

fn write_stdout_once(bytes: &[u8]) {
    write_bytes_best_effort(&mut io::stdout(), bytes);
}

fn write_bytes_best_effort<W: Write>(w: &mut W, bytes: &[u8]) {
    let _ = w.write_all(bytes);
    let _ = w.flush();
}

/// Deterministic stdin → `INPUT_CONTROL_FAILED` vs lexical validation.
///
/// Mapping (contract §6.2 + §7 justification):
/// - empty / multi-line / trailing secondary content / oversize / bad UTF-8 / NUL
///   in the raw channel → `INPUT_CONTROL_FAILED`
/// - a single well-formed UTF-8 line that fails path grammar → lexical codes
///   via `validate_external_selection` (`INVALID_SELECTION` / `UNSAFE_PATH_COMPONENT`)
fn read_stdin_selection() -> Result<String, RunnerCode> {
    let mut buf = Vec::new();
    io::stdin()
        .take(1025)
        .read_to_end(&mut buf)
        .map_err(|_| RunnerCode::InputControlFailed)?;
    // Cap: take(1025) may yield 1025 → oversize channel.
    parse_stdin_channel(&buf)
}

#[cfg(test)]
fn redact_unwindable_panic<F>(op: F) -> RunnerResult
where
    F: FnOnce() -> RunnerResult,
{
    match panic::catch_unwind(AssertUnwindSafe(op)) {
        Ok(r) => r,
        Err(_) => RunnerResult::failed(RunnerCode::Internal),
    }
}

#[cfg(test)]
mod panic_redaction_tests {
    use super::*;
    use std::io;

    #[test]
    fn success_envelope_ok_code() {
        let r = RunnerResult::ok();
        let line = format_result_json(&r);
        assert_eq!(
            line,
            "{\"code\":\"RULE5_PROTECTED_RUNNER_OK\",\"outcome\":\"PROCEDURE_COMPLETED\"}\n"
        );
        assert_eq!(line.matches('\n').count(), 1);
        assert!(line.starts_with("{\"code\":"));
        assert!(line.contains(",\"outcome\":"));
    }

    #[test]
    fn fixed_failure_envelope() {
        let r = RunnerResult::failed(RunnerCode::Oversize);
        let line = format_result_json(&r);
        assert_eq!(
            line,
            "{\"code\":\"RULE5_PROTECTED_RUNNER_OVERSIZE\",\"outcome\":\"PROCEDURE_NON_SUCCESS\"}\n"
        );
    }

    #[test]
    fn induced_panic_maps_to_internal() {
        panic::set_hook(Box::new(|_| {}));
        const SENTINEL: &str = "PANIC_SENTINEL_MUST_NOT_LEAK_c3d7";
        let r = redact_unwindable_panic(|| panic!("{SENTINEL}"));
        assert_eq!(r.outcome, RunnerOutcome::ProcedureNonSuccess);
        assert_eq!(r.failure_code, Some(RunnerCode::Internal));
        let line = format_result_json(&r);
        assert!(!line.contains(SENTINEL));
        assert!(!line.to_ascii_lowercase().contains("panic"));
        assert!(!line.to_ascii_lowercase().contains("backtrace"));
        assert_eq!(
            line,
            "{\"code\":\"RULE5_PROTECTED_RUNNER_INTERNAL\",\"outcome\":\"PROCEDURE_NON_SUCCESS\"}\n"
        );
    }

    #[test]
    fn write_failure_does_not_panic_or_require_stderr() {
        struct FailWriter;
        impl Write for FailWriter {
            fn write(&mut self, _buf: &[u8]) -> io::Result<usize> {
                Err(io::Error::new(io::ErrorKind::Other, "fail"))
            }
            fn flush(&mut self) -> io::Result<()> {
                Err(io::Error::new(io::ErrorKind::Other, "fail"))
            }
        }
        let line = format_result_json(&RunnerResult::failed(RunnerCode::Internal));
        write_bytes_best_effort(&mut FailWriter, line.as_bytes());
    }

    #[test]
    fn display_message_equals_failure_code() {
        for c in RunnerCode::ALL {
            assert_eq!(format!("{c}"), c.as_str());
        }
    }
}
