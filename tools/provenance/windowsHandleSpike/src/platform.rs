//! Platform gate (C3C-Q05): Windows 11 x64 only.
//!
//! `RtlGetVersion` is a documented ntdll export. windows-sys 0.61.2 places it under
//! `Wdk_System_SystemServices`, outside the frozen five-feature allowlist, so this
//! module binds the documented symbol directly without expanding Cargo features.

use crate::codes::SpikeCode;

#[cfg(windows)]
#[repr(C)]
struct OsVersionInfoW {
    os_version_info_size: u32,
    major_version: u32,
    minor_version: u32,
    build_number: u32,
    platform_id: u32,
    csd_version: [u16; 128],
}

#[cfg(windows)]
#[link(name = "ntdll")]
extern "system" {
    fn RtlGetVersion(info: *mut OsVersionInfoW) -> i32;
}

/// Windows 11 desktop family uses build >= 22000.
const WIN11_MIN_BUILD: u32 = 22000;

pub fn require_windows11_x64() -> Result<(), SpikeCode> {
    #[cfg(not(windows))]
    {
        return Err(SpikeCode::UnsupportedPlatform);
    }
    #[cfg(windows)]
    {
        if std::env::consts::ARCH != "x86_64" {
            return Err(SpikeCode::UnsupportedPlatform);
        }
        unsafe {
            let mut info = OsVersionInfoW {
                os_version_info_size: std::mem::size_of::<OsVersionInfoW>() as u32,
                major_version: 0,
                minor_version: 0,
                build_number: 0,
                platform_id: 0,
                csd_version: [0; 128],
            };
            let st = RtlGetVersion(&mut info);
            if st != 0 {
                return Err(SpikeCode::UnsupportedPlatform);
            }
            // Windows 11 reports major 10 with build >= 22000.
            if info.major_version < 10 || info.build_number < WIN11_MIN_BUILD {
                return Err(SpikeCode::UnsupportedPlatform);
            }
        }
        Ok(())
    }
}
