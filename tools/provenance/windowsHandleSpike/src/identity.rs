//! Authoritative identity tuple frozen from spike evidence (C3C-Q12).
//!
//! Frozen tuple after successful FileIdInfo proof on owner Win11 fixed NTFS:
//! `(volume_serial_u64, file_id_u128, number_of_links_u32)` sourced from
//! `GetFileInformationByHandleEx(FileIdInfo)` + `FileStandardInfo.NumberOfLinks`.
//! `BY_HANDLE_FILE_INFORMATION` is collected as compatibility evidence only
//! (not sole identity). Size/timestamps are never sole identity.

use crate::codes::SpikeCode;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct IdentityTuple {
    pub volume_serial: u64,
    pub file_id: u128,
    pub number_of_links: u32,
}

/// Pure immutable identity equality (T12-C).
pub fn identity_tuples_equal(a: &IdentityTuple, b: &IdentityTuple) -> bool {
    a.volume_serial == b.volume_serial
        && a.file_id == b.file_id
        && a.number_of_links == b.number_of_links
}

/// Pure comparator mapping for re-check (T12-C / during-read re-query).
pub fn compare_identity_or_changed(
    expected: &IdentityTuple,
    observed: &IdentityTuple,
) -> Result<(), SpikeCode> {
    if identity_tuples_equal(expected, observed) {
        Ok(())
    } else {
        Err(SpikeCode::IdentityChanged)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn t12_c_equal_and_unequal() {
        let a = IdentityTuple {
            volume_serial: 1,
            file_id: 2,
            number_of_links: 1,
        };
        let b = a;
        assert!(compare_identity_or_changed(&a, &b).is_ok());
        let c = IdentityTuple {
            volume_serial: 1,
            file_id: 3,
            number_of_links: 1,
        };
        assert_eq!(
            compare_identity_or_changed(&a, &c),
            Err(SpikeCode::IdentityChanged)
        );
    }
}
