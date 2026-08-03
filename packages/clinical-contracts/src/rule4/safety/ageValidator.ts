import {
  bandFromDaysAndCalendar,
  calendarDaysBetween,
  firstBirthdayDate,
  isStrictlyBeforeCalendar,
  parseIsoDateOnly,
} from './dateCalendar.js';
import type {
  Rule4AgeResolution,
  Rule4AgeVerificationStatus,
  Rule4PediatricBand,
  Rule4VerifiedAgeContextPhase2,
} from './types.js';

export type Rule4ControlledAgeSource =
  | 'VERIFIED_DOB_CALENDAR'
  | 'DOCTOR_STRUCTURED'
  | 'APPROVED_UPSTREAM'
  | 'VERIFIED_IDENTITY_REGISTRATION';

const UPSTREAM_AGE_SOURCES = new Set<string>([
  'VERIFIED_DOB_CALENDAR',
  'DOCTOR_STRUCTURED',
  'APPROVED_UPSTREAM',
  'VERIFIED_IDENTITY_REGISTRATION',
]);

const P13_BANDS = new Set<string>(['P13_A', 'P13_B', 'P13_C', 'P13_D', 'P13_E']);

function bandFromDobCalendar(ctx: Rule4VerifiedAgeContextPhase2): Rule4AgeResolution | null {
  const dob = parseIsoDateOnly(ctx.verifiedDateOfBirth);
  const assessment = parseIsoDateOnly(ctx.consultationAssessmentDate);
  if (!dob || !assessment) {
    return null;
  }
  const days = calendarDaysBetween(dob, assessment);
  if (days < 0) {
    return {
      verificationStatus: 'INVALID',
      pediatricBand: null,
      daysSinceBirth: days,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_INVALID'],
      limitationCodes: [],
    };
  }
  const fb = firstBirthdayDate(dob);
  const isUnderOne = isStrictlyBeforeCalendar(assessment, fb);
  const band = bandFromDaysAndCalendar(days, dob, assessment);
  return {
    verificationStatus: 'VERIFIED',
    pediatricBand: band,
    daysSinceBirth: days,
    isUnderOneYear: isUnderOne,
    reasonCodes: [],
    limitationCodes: [],
  };
}

function upstreamBandCandidate(ctx: Rule4VerifiedAgeContextPhase2): Rule4PediatricBand | null {
  if (ctx.pediatricBandVerificationStatus !== 'VERIFIED') {
    return null;
  }
  const band = ctx.upstreamVerifiedPediatricBand;
  if (band == null || !P13_BANDS.has(band)) {
    return null;
  }
  return band;
}

function resolveFromUpstreamBand(ctx: Rule4VerifiedAgeContextPhase2): Rule4AgeResolution | null {
  const band = upstreamBandCandidate(ctx);
  if (band == null) {
    return null;
  }
  const ageSource = ctx.ageSource?.trim() ?? '';
  if (!ageSource) {
    return {
      verificationStatus: 'UNRESOLVED',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['UPSTREAM_AGE_BAND_PROVENANCE_MISSING'],
      limitationCodes: ['UPSTREAM_AGE_BAND_PROVENANCE_REQUIRED'],
    };
  }
  if (ageSource === 'OWNER_STRUCTURED' || !UPSTREAM_AGE_SOURCES.has(ageSource)) {
    return {
      verificationStatus: 'UNRESOLVED',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['UPSTREAM_AGE_SOURCE_NOT_AUTHORIZED'],
      limitationCodes: ['UPSTREAM_AGE_BAND_PROVENANCE_REQUIRED'],
    };
  }
  const isUnderOne = band === 'P13_A' || band === 'P13_B';
  return {
    verificationStatus: 'VERIFIED',
    pediatricBand: band,
    daysSinceBirth: null,
    isUnderOneYear: isUnderOne,
    reasonCodes: [],
    limitationCodes: [],
  };
}

function statusReason(status: Rule4AgeVerificationStatus): string | null {
  if (status === 'MISSING') {
    return 'VERIFIED_AGE_MISSING';
  }
  if (status === 'INVALID') {
    return 'VERIFIED_AGE_INVALID';
  }
  if (status === 'CONTRADICTORY') {
    return 'VERIFIED_AGE_CONTRADICTORY';
  }
  return null;
}

/** Verified age resolution — no float/rounding hard-stop inference. */
export function resolveVerifiedAge(ctx: Rule4VerifiedAgeContextPhase2): Rule4AgeResolution {
  if (ctx.verificationStatus === 'CONTRADICTORY') {
    return {
      verificationStatus: 'CONTRADICTORY',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_CONTRADICTORY'],
      limitationCodes: [],
    };
  }
  if (ctx.verificationStatus === 'INVALID') {
    return {
      verificationStatus: 'INVALID',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_INVALID'],
      limitationCodes: [],
    };
  }
  if (ctx.verificationStatus === 'MISSING') {
    return {
      verificationStatus: 'MISSING',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_MISSING'],
      limitationCodes: [],
    };
  }

  const dobRaw = ctx.verifiedDateOfBirth;
  const assessRaw = ctx.consultationAssessmentDate;
  if (dobRaw != null && String(dobRaw).trim() !== '' && parseIsoDateOnly(dobRaw) == null) {
    return {
      verificationStatus: 'INVALID',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_INVALID'],
      limitationCodes: [],
    };
  }
  if (assessRaw != null && String(assessRaw).trim() !== '' && parseIsoDateOnly(assessRaw) == null) {
    return {
      verificationStatus: 'INVALID',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_INVALID'],
      limitationCodes: [],
    };
  }

  const fromDob = bandFromDobCalendar(ctx);
  const upstreamBand = upstreamBandCandidate(ctx);
  const hasDobPair =
    parseIsoDateOnly(ctx.verifiedDateOfBirth) != null &&
    parseIsoDateOnly(ctx.consultationAssessmentDate) != null;

  if (hasDobPair && fromDob) {
    if (fromDob.verificationStatus === 'INVALID') {
      return fromDob;
    }
    if (upstreamBand != null && fromDob.pediatricBand !== upstreamBand) {
      return {
        verificationStatus: 'CONTRADICTORY',
        pediatricBand: null,
        daysSinceBirth: fromDob.daysSinceBirth,
        isUnderOneYear: false,
        reasonCodes: ['VERIFIED_AGE_CONTRADICTORY'],
        limitationCodes: ['DOB_UPSTREAM_PEDIATRIC_BAND_CONFLICT'],
      };
    }
    if (upstreamBand != null && fromDob.pediatricBand === upstreamBand) {
      return fromDob;
    }
    return fromDob;
  }

  if (upstreamBand != null && ctx.pediatricBandVerificationStatus === 'VERIFIED') {
    return (
      resolveFromUpstreamBand(ctx) ?? {
        verificationStatus: 'UNRESOLVED',
        pediatricBand: null,
        daysSinceBirth: null,
        isUnderOneYear: false,
        reasonCodes: ['UPSTREAM_AGE_BAND_INVALID_SUPPORTING'],
        limitationCodes: [],
      }
    );
  }

  if (hasDobPair && !fromDob) {
    return {
      verificationStatus: 'INVALID',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_INVALID'],
      limitationCodes: [],
    };
  }

  const fromUpstream = resolveFromUpstreamBand(ctx);
  if (fromUpstream) {
    return fromUpstream;
  }

  if (ctx.ageYears != null && typeof ctx.ageYears === 'number') {
    return {
      verificationStatus: 'UNRESOLVED',
      pediatricBand: null,
      daysSinceBirth: null,
      isUnderOneYear: false,
      reasonCodes: ['VERIFIED_AGE_MISSING'],
      limitationCodes: [],
    };
  }

  const mapped = statusReason(ctx.verificationStatus);
  return {
    verificationStatus: ctx.verificationStatus,
    pediatricBand: null,
    daysSinceBirth: null,
    isUnderOneYear: false,
    reasonCodes: mapped ? [mapped] : ['VERIFIED_AGE_MISSING'],
    limitationCodes: [],
  };
}

export { parseIsoDateOnly, firstBirthdayDate, bandFromDaysAndCalendar };
