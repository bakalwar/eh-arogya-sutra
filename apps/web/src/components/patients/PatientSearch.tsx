'use client';

export function PatientSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ehas2-field">
      <label htmlFor="patient-search">Search patients</label>
      <input
        id="patient-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Name or synthetic ID"
        autoComplete="off"
      />
    </div>
  );
}

export function PatientFilters({
  status,
  sort,
  onStatus,
  onSort,
}: {
  status: string;
  sort: string;
  onStatus: (value: 'all' | 'active' | 'follow-up' | 'inactive') => void;
  onSort: (value: 'name' | 'recent' | 'age') => void;
}) {
  return (
    <div className="ehas2-filter-row">
      <div className="ehas2-field">
        <label htmlFor="patient-status">Status</label>
        <select
          id="patient-status"
          value={status}
          onChange={(e) => onStatus(e.target.value as 'all' | 'active' | 'follow-up' | 'inactive')}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="follow-up">Follow-up</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="ehas2-field">
        <label htmlFor="patient-sort">Sort</label>
        <select
          id="patient-sort"
          value={sort}
          onChange={(e) => onSort(e.target.value as 'name' | 'recent' | 'age')}
        >
          <option value="recent">Recent consultation</option>
          <option value="name">Name</option>
          <option value="age">Age</option>
        </select>
      </div>
    </div>
  );
}
