//! Fixed spike outcomes (documentation-authorized identifiers only).

use crate::codes::SpikeCode;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SpikeOutcome {
    SpikeControlProven,
    SpikeControlFailed,
    C3cBlocked,
}

impl SpikeOutcome {
    pub fn as_str(self) -> &'static str {
        match self {
            SpikeOutcome::SpikeControlProven => "SPIKE_CONTROL_PROVEN",
            SpikeOutcome::SpikeControlFailed => "SPIKE_CONTROL_FAILED",
            SpikeOutcome::C3cBlocked => "C3C_BLOCKED",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SpikeResult {
    pub outcome: SpikeOutcome,
    pub code: Option<SpikeCode>,
}

impl SpikeResult {
    pub fn proven() -> Self {
        Self {
            outcome: SpikeOutcome::SpikeControlProven,
            code: None,
        }
    }

    pub fn failed(code: SpikeCode) -> Self {
        Self {
            outcome: SpikeOutcome::SpikeControlFailed,
            code: Some(code),
        }
    }

    pub fn blocked(code: SpikeCode) -> Self {
        Self {
            outcome: SpikeOutcome::C3cBlocked,
            code: Some(code),
        }
    }
}
