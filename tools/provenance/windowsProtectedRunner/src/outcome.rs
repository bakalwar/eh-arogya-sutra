//! C3D categorical outcomes (contract §6.3). Distinct from C3C spike outcomes.
//! Provenance: structural pattern from C3C `windowsHandleSpike/src/outcome.rs`;
//! vocabulary and success OK encoding are C3D-only.

use crate::codes::RunnerCode;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RunnerOutcome {
    ProcedureCompleted,
    ProcedureNonSuccess,
}

impl RunnerOutcome {
    pub fn as_str(self) -> &'static str {
        match self {
            RunnerOutcome::ProcedureCompleted => "PROCEDURE_COMPLETED",
            RunnerOutcome::ProcedureNonSuccess => "PROCEDURE_NON_SUCCESS",
        }
    }
}

/// Success carries fixed OK; failures carry one of the 15 taxonomy codes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RunnerResult {
    pub outcome: RunnerOutcome,
    /// `None` means success → serialize as `RULE5_PROTECTED_RUNNER_OK`.
    pub failure_code: Option<RunnerCode>,
}

impl RunnerResult {
    pub fn ok() -> Self {
        Self {
            outcome: RunnerOutcome::ProcedureCompleted,
            failure_code: None,
        }
    }

    pub fn failed(code: RunnerCode) -> Self {
        Self {
            outcome: RunnerOutcome::ProcedureNonSuccess,
            failure_code: Some(code),
        }
    }

    pub fn code_str(&self) -> &'static str {
        match self.failure_code {
            None => "RULE5_PROTECTED_RUNNER_OK",
            Some(c) => c.as_str(),
        }
    }
}
